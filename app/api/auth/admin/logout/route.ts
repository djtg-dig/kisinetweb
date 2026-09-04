import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_ACCESS_COOKIE_NAME, ADMIN_REFRESH_COOKIE_NAME } from "@/lib/server/admin-cookies";
import { signedBackendFetch } from "@/lib/server/backend-fetch";
import {
  CSRF_HEADER_NAME,
  createCsrfErrorResponse,
  getCsrfToken,
  validateCsrfToken,
  validateOrigin,
} from "@/lib/server/csrf";

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return createCsrfErrorResponse();
  }
  const csrfCookie = getCsrfToken(request);
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);
  if (!validateCsrfToken(csrfCookie, csrfHeader)) {
    return createCsrfErrorResponse();
  }

  const accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await signedBackendFetch({
        path: "/api/admin/auth/logout/",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
        accessToken: accessToken || undefined,
      });
    } catch {
      // Best effort logout
    }
  }

  const nextResponse = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";

  nextResponse.cookies.set({
    name: ADMIN_ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });

  nextResponse.cookies.set({
    name: ADMIN_REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });

  return nextResponse;
}
