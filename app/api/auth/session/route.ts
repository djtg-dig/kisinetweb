import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/server/cookies";
import { signedBackendFetch } from "@/lib/server/backend-fetch";
import { refreshTokens } from "@/lib/server/token-refresh";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const response = await signedBackendFetch({
      path: "/api/accounts/session/",
      method: "GET",
      accessToken,
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ authenticated: true, user: data.user });
    }

    if (response.status === 401) {
      if (!refreshToken) {
        const logoutResponse = NextResponse.json({ authenticated: false, user: null });
        clearAuthCookies(logoutResponse);
        return logoutResponse;
      }

      const refreshed = await refreshTokens({
        scope: "account",
        refreshToken,
      });
      if (refreshed.kind === "refreshed") {
        const retryResponse = await signedBackendFetch({
          path: "/api/accounts/session/",
          method: "GET",
          accessToken: refreshed.accessToken,
          cache: "no-store",
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          const response = NextResponse.json({ authenticated: true, user: data.user });
          setAuthCookies(response, refreshed.accessToken, refreshed.refreshToken);
          return response;
        }

        if (retryResponse.status === 401) {
          const logoutResponse = NextResponse.json({ authenticated: false, user: null });
          clearAuthCookies(logoutResponse);
          return logoutResponse;
        }

        const unavailableResponse = sessionUnavailableResponse();
        setAuthCookies(unavailableResponse, refreshed.accessToken, refreshed.refreshToken);
        return unavailableResponse;
      }

      if (refreshed.kind === "invalid") {
        const logoutResponse = NextResponse.json({ authenticated: false, user: null });
        clearAuthCookies(logoutResponse);
        return logoutResponse;
      }

      return sessionUnavailableResponse();
    }

    return sessionUnavailableResponse();
  } catch {
    return sessionUnavailableResponse();
  }
}

function sessionUnavailableResponse() {
  return NextResponse.json(
    { authenticated: false, user: null, error: "session_unavailable" },
    { status: 503 },
  );
}

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = process.env.NODE_ENV === "production";
  const accessOptions = {
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax" as const,
    secure: isProduction,
  };

  const refreshOptions = {
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
    sameSite: "lax" as const,
    secure: isProduction,
  };

  response.cookies.set(accessOptions);
  response.cookies.set(refreshOptions);
}

function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
