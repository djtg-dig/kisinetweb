import "server-only";

export const ACCESS_COOKIE_NAME = "kisinet_access";
export const REFRESH_COOKIE_NAME = "kisinet_refresh";

export const ACCESS_COOKIE_MAX_AGE = 60 * 60;
export const REFRESH_COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

export type AuthCookies = {
  accessToken: string;
  refreshToken: string;
};

export function createAuthCookiesHeaders(
  accessToken: string,
  refreshToken: string,
  isProduction: boolean,
): Headers {
  const headers = new Headers();

  const accessOptions = {
    httpOnly: true,
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: isProduction,
  };

  const refreshOptions = {
    httpOnly: true,
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: isProduction,
  };

  const accessCookie = formatCookie(ACCESS_COOKIE_NAME, accessToken, accessOptions);
  const refreshCookie = formatCookie(REFRESH_COOKIE_NAME, refreshToken, refreshOptions);

  headers.set("Set-Cookie", [accessCookie, refreshCookie].join(", "));

  return headers;
}

export function createLogoutCookiesHeaders(isProduction: boolean): Headers {
  const headers = new Headers();

  const cookieOptions = {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    secure: isProduction,
  };

  const accessCookie = formatCookie(ACCESS_COOKIE_NAME, "", cookieOptions);
  const refreshCookie = formatCookie(REFRESH_COOKIE_NAME, "", cookieOptions);

  headers.set("Set-Cookie", [accessCookie, refreshCookie].join(", "));

  return headers;
}

function formatCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    path: string;
    maxAge: number;
    sameSite: "lax" | "strict" | "none";
    secure: boolean;
  },
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  cookie += `; Path=${options.path}`;
  cookie += `; Max-Age=${options.maxAge}`;
  cookie += `; SameSite=${options.sameSite}`;
  if (options.secure) {
    cookie += "; Secure";
  }
  if (options.httpOnly) {
    cookie += "; HttpOnly";
  }
  return cookie;
}
