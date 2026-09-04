import { NextResponse, type NextRequest } from "next/server";

import { carriAccountBackendLoginUrl } from "@/lib/server/backend-url";

export function GET(request: NextRequest) {
  // Cette Route Handler garde le redirect OAuth direct vers Django/Carri Account.
  const backendUrl = new URL(carriAccountBackendLoginUrl);

  // Les paramètres de navigation restent contrôlés par le backend OAuth.
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(backendUrl);
}
