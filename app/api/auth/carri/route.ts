import { NextResponse, type NextRequest } from "next/server";
import { carriAccountBackendLoginUrl } from "@/lib/carri-account";

export function GET(request: NextRequest) {
  const backendUrl = new URL(carriAccountBackendLoginUrl);

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(backendUrl);
}
