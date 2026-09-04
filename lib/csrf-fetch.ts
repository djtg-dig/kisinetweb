"use client";

const CSRF_COOKIE_NAME = "kisinet_csrf";
const CSRF_HEADER_NAME = "X-Kisinet-CSRF";

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp("(^| )" + CSRF_COOKIE_NAME + "=([^;]+)"));
  return match ? match[2] : null;
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = new Headers(init?.headers);
  if (isMutation) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
    headers.set("credentials", "include");
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: isMutation ? "include" : init?.credentials,
  });
}
