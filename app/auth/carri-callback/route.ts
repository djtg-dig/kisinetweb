import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { signedBackendFetch } from "@/lib/server/backend-fetch";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/server/cookies";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/server/csrf";

const CARRI_HANDOFF_PATH = "/api/carri-account/handoff/consume/";
const CARRI_HANDOFF_TTL_SECONDS = 120;

type CarriHandoffPayload = {
  access?: string;
  refresh?: string;
  user?: unknown;
  carri_identity?: unknown;
};

export async function GET(request: NextRequest) {
  const handoff = request.nextUrl.searchParams.get("handoff");

  if (!handoff) {
    return NextResponse.redirect(new URL("/auth/carri?error=no_handoff", request.url));
  }

  try {
    const response = await signedBackendFetch({
      path: CARRI_HANDOFF_PATH,
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ handoff }),
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/auth/carri?error=callback_failed", request.url));
    }

    const payload = (await response.json()) as CarriHandoffPayload;
    const access = typeof payload?.access === "string" ? payload.access : "";
    const refresh = typeof payload?.refresh === "string" ? payload.refresh : "";

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

    // Le handoff est à usage unique côté backend ; on bloque aussi un éventuel
    // rejeu via le navigateur pendant la fenêtre de tolérance serveur.
    nextResponse.headers.set("Cache-Control", "no-store, max-age=" + CARRI_HANDOFF_TTL_SECONDS);

    return nextResponse;
  } catch {
    return NextResponse.redirect(new URL("/auth/carri?error=server_error", request.url));
  }
}