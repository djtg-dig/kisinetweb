import { NextResponse, type NextRequest } from "next/server";

const adminHost = process.env.ADMIN_HOST || "admin.kisinet.com";
const adminHostname = hostnameFromHost(adminHost);
const publicHostnames = ["kisinet.com", "www.kisinet.com"];

const adminAllowedPathPrefixes = [
  "/admin/",
  "/api/auth/admin",
  "/api/auth/csrf",
  "/api/backend/api/admin",
  "/api/backend/api/paiements/admin",
  "/api/backend/api/paiements/currencies",
  "/api/backend/api/pharmacies/countries",
  "/_next",
];

const adminAllowedFiles = [
  "/favicon.ico",
  "/favicon.svg",
  "/kisinet-logo.png",
  "/robots.txt",
];

function hostnameFromHost(host: string | null) {
  return (host || "").split(":")[0]?.toLowerCase() || "";
}

function isAdminHost(host: string | null) {
  return hostnameFromHost(host) === adminHostname;
}

function isPublicProductionHost(host: string | null) {
  return publicHostnames.includes(hostnameFromHost(host));
}

function isAllowedOnAdminHost(pathname: string) {
  return (
    adminAllowedPathPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    adminAllowedFiles.includes(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicProductionHost(request.headers.get("host")) && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = adminHost;
    return NextResponse.redirect(url);
  }

  if (!isAdminHost(request.headers.get("host"))) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isAllowedOnAdminHost(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/favicon.svg", "/kisinet-logo.png", "/robots.txt"],
};
