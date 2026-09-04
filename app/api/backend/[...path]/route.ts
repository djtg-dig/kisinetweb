import { NextResponse, type NextRequest } from "next/server";

import { filterResponseHeaders, signedBackendFetch } from "@/lib/server/backend-fetch";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/server/cookies";

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

    const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!accessToken) {
      return NextResponse.json({ detail: "Non authentifié." }, { status: 401 });
    }

    const body = method === "GET" || method === "HEAD" ? null : await request.arrayBuffer();

    const response = await signedBackendFetch({
      path: backendPath,
      method,
      headers: request.headers,
      body,
      accessToken,
    });

    if (response.status === 401 && refreshToken) {
      const refreshed = await tryRefreshTokens(refreshToken, accessToken);
      if (refreshed) {
        const retryResponse = await signedBackendFetch({
          path: backendPath,
          method,
          headers: request.headers,
          body,
          accessToken: refreshed.newAccessToken,
        });

        if (retryResponse.ok) {
          const bodyBytes = await retryResponse.arrayBuffer();
          const nextResponse = new NextResponse(bodyBytes, {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            headers: filterResponseHeaders(retryResponse.headers),
          });
          setAuthCookies(nextResponse, refreshed.newAccessToken, refreshed.newRefreshToken || refreshToken);
          return nextResponse;
        }

        if (retryResponse.status === 401) {
          const errorResponse = NextResponse.json({ detail: "Session expirée." }, { status: 401 });
          clearAuthCookies(errorResponse);
          return errorResponse;
        }
      }

      const errorResponse = NextResponse.json({ detail: "Session expirée." }, { status: 401 });
      clearAuthCookies(errorResponse);
      return errorResponse;
    }

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

type RefreshResult = {
  newAccessToken: string;
  newRefreshToken: string;
} | null;

async function tryRefreshTokens(refreshToken: string, currentAccessToken: string): Promise<RefreshResult> {
  try {
    const response = await signedBackendFetch({
      path: "/api/accounts/token/refresh/",
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
      accessToken: currentAccessToken,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      newAccessToken: data.access,
      newRefreshToken: data.refresh || refreshToken,
    };
  } catch {
    return null;
  }
}

function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
    secure: isProduction,
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
    sameSite: "lax",
    secure: isProduction,
  });
}

function clearAuthCookies(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });
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

export const GET = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const PATCH = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
export const HEAD = proxyBackendRequest;
