import { NextResponse, type NextRequest } from "next/server";
import { carriAccountBackendLoginUrl } from "@/lib/carri-account";

type RateLimitResponse = {
  detail?: unknown;
  retry_after_seconds?: unknown;
};

function buildRateLimitedUrl(request: NextRequest, payload: RateLimitResponse) {
  const url = new URL("/auth/carri/rate-limited", request.url);
  const message =
    typeof payload.detail === "string"
      ? payload.detail
      : "Trop de tentatives. Veuillez patienter avant de réessayer.";

  url.searchParams.set("message", message);

  if (
    typeof payload.retry_after_seconds === "number" ||
    typeof payload.retry_after_seconds === "string"
  ) {
    url.searchParams.set("retry_after_seconds", String(payload.retry_after_seconds));
  }

  return url;
}

export async function GET(request: NextRequest) {
  const backendUrl = new URL(carriAccountBackendLoginUrl);
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  const response = await fetch(backendUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    redirect: "manual",
  });

  if (response.status === 429) {
    let payload: RateLimitResponse = {};
    try {
      payload = (await response.json()) as RateLimitResponse;
    } catch {
      payload = {};
    }

    return NextResponse.redirect(buildRateLimitedUrl(request, payload));
  }

  const location = response.headers.get("location");
  if (location) {
    return NextResponse.redirect(location);
  }

  return NextResponse.redirect(new URL("/auth/carri/rate-limited", request.url));
}
