import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/server/cookies";
import { carriAccountCallbackUrl } from "@/lib/server/backend-url";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/server/csrf";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/carri?error=no_code", request.url));
  }

  try {
    const callbackUrl = new URL(carriAccountCallbackUrl);
    callbackUrl.searchParams.set("code", code);
    if (state) {
      callbackUrl.searchParams.set("state", state);
    }
    callbackUrl.searchParams.set("carri_callback_mode", "json");

    const response = await fetch(callbackUrl, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/auth/carri?error=callback_failed", request.url));
    }

    const payload = await response.json();
    const { access, refresh } = payload;

    if (!access || !refresh) {
      return NextResponse.redirect(new URL("/auth/carri?error=no_tokens", request.url));
    }

    const redirectUrl = new URL("/app/select-pharmacy", request.url);
    const nextResponse = NextResponse.redirect(redirectUrl);

    const isProduction = process.env.NODE_ENV === "production";

    nextResponse.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: access,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
      sameSite: "lax",
      secure: isProduction,
    });

    nextResponse.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: refresh,
      httpOnly: true,
      path: "/",
      maxAge: 90 * 24 * 60 * 60,
      sameSite: "lax",
      secure: isProduction,
    });

    nextResponse.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: generateCsrfToken(),
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      secure: isProduction,
    });

    return nextResponse;
  } catch {
    return NextResponse.redirect(new URL("/auth/carri?error=server_error", request.url));
  }
}
