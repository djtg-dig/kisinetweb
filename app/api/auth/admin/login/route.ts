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

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ detail: "Email et mot de passe requis." }, { status: 400 });
  }

  try {
    const response = await signedBackendFetch({
      path: "/api/admin/auth/login/",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return NextResponse.json({ detail: "Identifiants invalides." }, { status: 401 });
    }

    const data = await response.json();
    const accessToken = data.access;
    const refreshToken = data.refresh;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ detail: "Réponse invalide du serveur." }, { status: 502 });
    }

    const nextResponse = NextResponse.json({
      authenticated: true,
      admin: data.admin,
    });

    const isProduction = process.env.NODE_ENV === "production";

    nextResponse.cookies.set({
      name: ADMIN_ACCESS_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
      sameSite: "lax",
      secure: isProduction,
    });

    nextResponse.cookies.set({
      name: ADMIN_REFRESH_COOKIE_NAME,
      value: refreshToken,
      httpOnly: true,
      path: "/",
      maxAge: 90 * 24 * 60 * 60,
      sameSite: "lax",
      secure: isProduction,
    });

    return nextResponse;
  } catch {
    return NextResponse.json({ detail: "Erreur serveur." }, { status: 502 });
  }
}
