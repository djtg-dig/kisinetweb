import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import {
  CSRF_COOKIE_NAME,
  getAllowedOrigin,
  getCsrfToken,
  setCsrfCookie,
  validateCsrfToken,
} from "@/lib/server/csrf";

export async function GET(request: NextRequest) {
  const response = NextResponse.json({});

  const existingToken = getCsrfToken(request);
  if (existingToken) {
    response.cookies.set(CSRF_COOKIE_NAME, existingToken, {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  setCsrfCookie(response);
  return response;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(request);

  if (origin && allowedOrigin && origin !== allowedOrigin) {
    return NextResponse.json({ code: "csrf_failed", detail: "Invalid origin." }, { status: 403 });
  }

  const csrfToken = getCsrfToken(request);
  const responseBody = await request.json().catch(() => ({}));
  const tokenFromBody = responseBody?.csrfToken;

  if (!validateCsrfToken(csrfToken, tokenFromBody)) {
    return NextResponse.json({ code: "csrf_failed", detail: "CSRF token mismatch." }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
