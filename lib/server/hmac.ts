import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";

export const HMAC_HEADER_NAMES = [
  "X-Kisinet-Client-Id",
  "X-Kisinet-Timestamp",
  "X-Kisinet-Nonce",
  "X-Kisinet-Content-SHA256",
  "X-Kisinet-Signature-Version",
  "X-Kisinet-Signature",
] as const;

export type HmacHeaderName = (typeof HMAC_HEADER_NAMES)[number];

export type CanonicalRequestInput = {
  clientId: string;
  timestamp: string;
  nonce: string;
  method: string;
  path: string;
  queryString?: string;
  bodySha256: string;
  version?: string;
};

export type HmacHeaderInput = {
  clientId?: string;
  method: string;
  path: string;
  queryString?: string;
  bodyBytes?: BodyInit | null;
  timestamp?: string;
  nonce?: string;
  version?: string;
  secret?: string;
};

export function computeBodySha256(bodyBytes?: BodyInit | null): string {
  // Le backend signe les octets bruts du body ; une absence de body vaut bytes vides.
  return createHash("sha256").update(toHashableBody(bodyBytes)).digest("hex");
}

export function canonicalizePathAndQuery(path: string, queryString = ""): string {
  // Reproduction de urllib.parse.parse_qsl(..., keep_blank_values=True) + urlencode(sorted(...)).
  const pairs = parseQueryKeepingBlankValues(queryString);
  const canonicalQuery = pairs
    .sort((left, right) => comparePair(left, right))
    .map(([key, value]) => pythonUrlEncode(key) + "=" + pythonUrlEncode(value))
    .join("&");
  const canonicalPath = path || "/";

  return canonicalQuery ? canonicalPath + "?" + canonicalQuery : canonicalPath;
}

export function buildCanonicalRequest(input: CanonicalRequestInput): string {
  // La chaîne canonique doit rester strictement alignée avec core/security/hmac.py.
  return [
    input.version ?? "v1",
    input.clientId,
    input.timestamp,
    input.nonce,
    input.method.toUpperCase(),
    canonicalizePathAndQuery(input.path, input.queryString ?? ""),
    input.bodySha256,
  ].join("\n");
}

export function computeHmacSignature(secret: string, canonicalRequest: string): string {
  // HMAC-SHA256 hexadécimal, identique à Python hmac.new(...).hexdigest().
  return createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(canonicalRequest, "utf8")
    .digest("hex");
}

export function createHmacHeaders(input: HmacHeaderInput): Headers {
  const clientId = input.clientId ?? process.env.KISINET_HMAC_CLIENT_ID ?? "kisinet-web";
  const version = input.version ?? process.env.KISINET_HMAC_SIGNATURE_VERSION ?? "v1";
  const secret = input.secret ?? process.env.KISINET_HMAC_SECRET ?? "";

  if (!secret) {
    throw new Error("KISINET_HMAC_SECRET est requis côté serveur Next.js.");
  }

  const timestamp = input.timestamp ?? String(Math.floor(Date.now() / 1000));
  const nonce = input.nonce ?? randomUUID();
  const bodySha256 = computeBodySha256(input.bodyBytes);
  const canonicalRequest = buildCanonicalRequest({
    clientId,
    timestamp,
    nonce,
    method: input.method,
    path: input.path,
    queryString: input.queryString ?? "",
    bodySha256,
    version,
  });
  const signature = computeHmacSignature(secret, canonicalRequest);

  return new Headers({
    "X-Kisinet-Client-Id": clientId,
    "X-Kisinet-Timestamp": timestamp,
    "X-Kisinet-Nonce": nonce,
    "X-Kisinet-Content-SHA256": bodySha256,
    "X-Kisinet-Signature-Version": version,
    "X-Kisinet-Signature": signature,
  });
}

function parseQueryKeepingBlankValues(queryString: string): [string, string][] {
  const cleanQuery = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  if (!cleanQuery) {
    return [];
  }

  return cleanQuery.split("&").map((part) => {
    const separatorIndex = part.indexOf("=");
    const rawKey = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
    const rawValue = separatorIndex === -1 ? "" : part.slice(separatorIndex + 1);

    return [pythonUrlDecode(rawKey), pythonUrlDecode(rawValue)];
  });
}

function comparePair(left: [string, string], right: [string, string]): number {
  const keyCompare = comparePythonStrings(left[0], right[0]);
  if (keyCompare !== 0) {
    return keyCompare;
  }

  return comparePythonStrings(left[1], right[1]);
}

function comparePythonStrings(left: string, right: string): number {
  const leftCodePoints = Array.from(left);
  const rightCodePoints = Array.from(right);
  const length = Math.min(leftCodePoints.length, rightCodePoints.length);

  for (let index = 0; index < length; index += 1) {
    const leftCodePoint = leftCodePoints[index].codePointAt(0) ?? 0;
    const rightCodePoint = rightCodePoints[index].codePointAt(0) ?? 0;

    if (leftCodePoint !== rightCodePoint) {
      return leftCodePoint - rightCodePoint;
    }
  }

  return leftCodePoints.length - rightCodePoints.length;
}

function pythonUrlDecode(value: string): string {
  // parse_qsl décode "+" comme un espace avant le tri et le ré-encodage.
  return decodeURIComponent(value.replace(/\+/g, " "));
}

function pythonUrlEncode(value: string): string {
  // urlencode/quote_plus encode les espaces en "+" et garde uniquement -._~ non échappés.
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (character) =>
      "%" + character.charCodeAt(0).toString(16).toUpperCase(),
    )
    .replace(/%20/g, "+");
}

function toHashableBody(bodyBytes?: BodyInit | null): string | Buffer {
  if (!bodyBytes) {
    return "";
  }
  if (typeof bodyBytes === "string") {
    return bodyBytes;
  }
  if (bodyBytes instanceof ArrayBuffer) {
    return Buffer.from(bodyBytes);
  }
  if (ArrayBuffer.isView(bodyBytes)) {
    return Buffer.from(bodyBytes.buffer, bodyBytes.byteOffset, bodyBytes.byteLength);
  }

  throw new Error("Body HMAC non supporté par le signer serveur.");
}
