"use client";

import { useCallback, useEffect, useState } from "react";

export type CsrfState = {
  csrfToken: string | null;
  loading: boolean;
  refreshCsrf: () => Promise<void>;
};

const CSRF_COOKIE_NAME = "kisinet_csrf";
const CSRF_ENDPOINT = "/api/auth/csrf";

export function useCsrf(): CsrfState {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCsrf = useCallback(async () => {
    try {
      const response = await fetch(CSRF_ENDPOINT, {
        credentials: "include",
      });
      if (response.ok) {
        const cookies = response.headers.get("set-cookie");
        if (cookies) {
          const match = cookies.match(/kisinet_csrf=([^;]+)/);
          if (match) {
            setCsrfToken(match[1]);
          }
        }
      }
    } catch {
      // Best effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existingToken = getCsrfCookie();
    if (existingToken) {
      setCsrfToken(existingToken);
      setLoading(false);
    } else {
      refreshCsrf();
    }
  }, [refreshCsrf]);

  return {
    csrfToken,
    loading,
    refreshCsrf,
  };
}

function getCsrfCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp("(^| )" + CSRF_COOKIE_NAME + "=([^;]+)"));
  return match ? match[2] : null;
}
