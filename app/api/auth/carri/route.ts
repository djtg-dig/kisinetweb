import { NextResponse, type NextRequest } from "next/server";

import { buildSafeAuthRedirect, AUTH_NEXT_COOKIE_MAX_AGE_SECONDS, AUTH_NEXT_COOKIE_NAME } from "@/lib/auth-utils";
import { carriAccountBackendLoginUrl } from "@/lib/server/backend-url";

export function GET(request: NextRequest) {
  // Cette Route Handler garde le redirect OAuth direct vers Django/Carri Account.
  const backendUrl = new URL(carriAccountBackendLoginUrl);

  // Les paramètres de navigation restent contrôlés par le backend OAuth.
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  const response = NextResponse.redirect(backendUrl);
  const next = request.nextUrl.searchParams.get("next");

  if (next) {
    response.cookies.set({
      name: AUTH_NEXT_COOKIE_NAME,
      value: buildSafeAuthRedirect(next),
      httpOnly: true,
      path: "/",
      maxAge: AUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
