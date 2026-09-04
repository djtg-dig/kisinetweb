import "server-only";

import { backendServerBaseUrl } from "@/lib/server/backend-url";
import { createHmacHeaders, HMAC_HEADER_NAMES } from "@/lib/server/hmac";

export type SignedBackendFetchInput = {
  path: string;
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  accessToken?: string;
  cache?: RequestCache;
  signal?: AbortSignal;
};

const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-language",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
  "location",
  "vary",
  "www-authenticate",
] as const;

export async function signedBackendFetch(input: SignedBackendFetchInput): Promise<Response> {
  const method = (input.method ?? "GET").toUpperCase();
  const backendUrl = buildBackendUrl(input.path);
  const requestBody = methodAllowsBody(method) ? input.body ?? null : null;
  const headers = buildBackendHeaders(input.headers);

  // Le JWT utilisateur reste séparé de HMAC : Authorization identifie l'utilisateur.
  if (input.accessToken) {
    headers.set("Authorization", "Bearer " + input.accessToken);
  }

  // Les headers HMAC sont toujours recréés côté serveur Next.js pour chaque tentative.
  createHmacHeaders({
    method,
    path: backendUrl.pathname,
    queryString: backendUrl.search ? backendUrl.search.slice(1) : "",
    bodyBytes: requestBody,
  }).forEach((value, key) => headers.set(key, value));

  return fetch(backendUrl, {
    method,
    headers,
    body: requestBody,
    cache: input.cache ?? "no-store",
    signal: input.signal,
  });
}

export function buildBackendUrl(path: string): URL {
  const safePath = normalizeBackendPath(path);
  const baseUrl = backendServerBaseUrl.replace(/\/$/, "");

  return new URL(safePath, baseUrl);
}

export function filterResponseHeaders(source: Headers): Headers {
  const headers = new Headers();

  // On relaie seulement les headers utiles aux clients et téléchargements.
  FORWARDED_RESPONSE_HEADERS.forEach((name) => {
    const value = source.get(name);
    if (value) {
      headers.set(name, value);
    }
  });

  return headers;
}

export function normalizeBackendPath(path: string): string {
  if (!path || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("//")) {
    throw new Error("Chemin backend invalide.");
  }

  const candidate = path.startsWith("/") ? path : "/" + path;
  const url = new URL(candidate, "http://kisinet.local");
  const decodedPath = decodeURIComponent(url.pathname);

  if (
    !url.pathname.startsWith("/api/") ||
    decodedPath.includes("..") ||
    decodedPath.includes("//") ||
    decodedPath.includes("\\") ||
    decodedPath.includes(":") ||
    decodedPath.includes("@")
  ) {
    throw new Error("Chemin backend non autorisé.");
  }

  return url.pathname + url.search;
}

function buildBackendHeaders(source?: HeadersInit): Headers {
  const incoming = new Headers(source);
  const headers = new Headers();

  // Allowlist volontaire : aucun header sensible navigateur n'est forwardé aveuglément.
  [
    "accept",
    "accept-language",
    "content-type",
    "idempotency-key",
    "if-none-match",
    "range",
  ].forEach((name) => {
    const value = incoming.get(name);
    if (value) {
      headers.set(name, value);
    }
  });

  HMAC_HEADER_NAMES.forEach((name) => headers.delete(name));

  return headers;
}

function methodAllowsBody(method: string): boolean {
  return method !== "GET" && method !== "HEAD";
}
