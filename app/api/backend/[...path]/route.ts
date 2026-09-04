import { NextResponse, type NextRequest } from "next/server";

import { filterResponseHeaders, signedBackendFetch } from "@/lib/server/backend-fetch";
import { ACCESS_COOKIE_NAME } from "@/lib/server/cookies";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;

async function proxyBackendRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const method = request.method.toUpperCase();
  if (!SUPPORTED_METHODS.includes(method as (typeof SUPPORTED_METHODS)[number])) {
    return NextResponse.json({ detail: "Méthode non supportée par le BFF." }, { status: 405 });
  }

  try {
    const params = await context.params;
    const backendPath = buildDjangoPath(params.path ?? [], request.nextUrl.search);
    const body = method === "GET" || method === "HEAD" ? null : await request.arrayBuffer();
    const accessToken = readAccessToken(request);
    const response = await signedBackendFetch({
      path: backendPath,
      method,
      headers: request.headers,
      body,
      accessToken,
    });

    if (process.env.NODE_ENV !== "production") {
      console.info("[BFF] " + method + " " + backendPath + " -> " + response.status);
    }

    return new Response(method === "HEAD" ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: filterResponseHeaders(response.headers),
    });
  } catch {
    return NextResponse.json({ detail: "Requête backend invalide ou indisponible." }, { status: 502 });
  }
}

function buildDjangoPath(parts: string[], search: string): string {
  const djangoParts = parts[0] === "api" ? parts.slice(1) : parts;
  const encodedParts = djangoParts.map((part) => encodeURIComponent(assertSafePathSegment(part)));

  // Le navigateur appelle /api/backend/*, mais Django reçoit et signe toujours /api/*.
  return "/api/" + encodedParts.join("/") + "/" + search;
}

function assertSafePathSegment(part: string): string {
  let decodedPart = part;
  for (let index = 0; index < 2; index += 1) {
    try {
      decodedPart = decodeURIComponent(decodedPart);
    } catch {
      throw new Error("Segment backend invalide.");
    }
  }

  if (
    decodedPart === "." ||
    decodedPart === ".." ||
    decodedPart.includes("/") ||
    decodedPart.includes("\\") ||
    decodedPart.includes(":") ||
    decodedPart.includes("@")
  ) {
    throw new Error("Segment backend non autorisé.");
  }

  return part;
}

function readAccessToken(request: NextRequest): string {
  const cookieToken = request.cookies?.get?.(ACCESS_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  const authorization = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  return authorization.startsWith(prefix) ? authorization.slice(prefix.length) : "";
}

export const GET = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const PATCH = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
export const HEAD = proxyBackendRequest;
