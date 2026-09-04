import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_ACCESS_COOKIE_NAME, ADMIN_REFRESH_COOKIE_NAME } from "@/lib/server/admin-cookies";
import { signedBackendFetch } from "@/lib/server/backend-fetch";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false, admin: null });
  }

  try {
    const response = await signedBackendFetch({
      path: "/api/admin/auth/me/",
      method: "GET",
      accessToken,
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ authenticated: true, admin: data });
    }

    if (response.status === 401 && refreshToken) {
      const refreshed = await tryRefreshTokens(refreshToken);
      if (refreshed) {
        const retryResponse = await signedBackendFetch({
          path: "/api/admin/auth/me/",
          method: "GET",
          accessToken: refreshed.newAccessToken,
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          const response = NextResponse.json({ authenticated: true, admin: data });
          setAdminCookies(response, refreshed.newAccessToken, refreshed.newRefreshToken);
          return response;
        }
      }

      const logoutResponse = NextResponse.json({ authenticated: false, admin: null });
      clearAdminCookies(logoutResponse);
      return logoutResponse;
    }

    return NextResponse.json({ authenticated: false, admin: null });
  } catch {
    return NextResponse.json({ authenticated: false, admin: null });
  }
}

type RefreshResult = {
  newAccessToken: string;
  newRefreshToken: string;
} | null;

async function tryRefreshTokens(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await signedBackendFetch({
      path: "/api/admin/auth/refresh/",
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
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

function setAdminCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
    secure: isProduction,
  });
  response.cookies.set({
    name: ADMIN_REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
    sameSite: "lax",
    secure: isProduction,
  });
}

function clearAdminCookies(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set({
    name: ADMIN_REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
