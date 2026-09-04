import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export const CSRF_COOKIE_NAME = "kisinet_csrf";
export const CSRF_HEADER_NAME = "X-Kisinet-CSRF";
export const CSRF_TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function setCsrfCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: generateCsrfToken(),
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
    secure: isProduction,
  });
}

export function getCsrfToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
}

export function validateCsrfToken(
  cookieValue: string | null,
  headerValue: string | null,
): boolean {
  if (!cookieValue || !headerValue) {
    return false;
  }
  if (cookieValue.length !== CSRF_TOKEN_LENGTH * 2) {
    return false;
  }
  try {
    const cookieBuf = Buffer.from(cookieValue, "hex");
    const headerBuf = Buffer.from(headerValue, "hex");
    if (cookieBuf.length !== headerBuf.length) {
      return false;
    }
    return timingSafeEqual(cookieBuf, headerBuf);
  } catch {
    return false;
  }
}

export function getAllowedOrigin(_request: NextRequest): string | null {
  const envOrigin = process.env.KISINET_APP_ORIGIN;
  if (envOrigin) {
    return envOrigin;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return null;
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(request);

  if (!origin) {
    return false;
  }

  if (!allowedOrigin) {
    return false;
  }

  return origin === allowedOrigin;
}

export function isMutationMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

export function createCsrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { code: "csrf_failed", detail: "CSRF validation failed." },
    { status: 403 },
  );
}
