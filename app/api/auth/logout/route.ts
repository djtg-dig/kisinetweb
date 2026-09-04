import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/server/cookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await fetch(
        `${process.env.KISINET_BACKEND_URL ?? "http://127.0.0.1:8002"}/api/accounts/logout/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${request.cookies.get(ACCESS_COOKIE_NAME)?.value ?? ""}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        },
      );
    } catch {
      // Best effort logout
    }
  }

  const nextResponse = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";

  nextResponse.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });

  nextResponse.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });

  return nextResponse;
}
