"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminSessionState = {
  authenticated: boolean;
  loading: boolean;
  admin: unknown | null;
  refreshSession: () => Promise<void>;
};

const SESSION_CACHE_DURATION = 30 * 1000;
const CSRF_ENDPOINT = "/api/auth/csrf";
const CSRF_COOKIE_NAME = "kisinet_csrf";
let cachedAdminSession: { data: { authenticated: boolean; admin: unknown } | null; timestamp: number } | null = null;

async function fetchAdminSession(): Promise<{ authenticated: boolean; admin: unknown }> {
  if (cachedAdminSession && Date.now() - cachedAdminSession.timestamp < SESSION_CACHE_DURATION) {
    return cachedAdminSession.data!;
  }

  try {
    const response = await fetch("/api/auth/admin/session", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await response.json();
    cachedAdminSession = { data, timestamp: Date.now() };
    return data;
  } catch {
    return { authenticated: false, admin: null };
  }
}

async function ensureCsrfToken(): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }
  const match = document.cookie.match(new RegExp("(^| )" + CSRF_COOKIE_NAME + "=([^;]+)"));
  if (match) {
    return;
  }
  try {
    await fetch(CSRF_ENDPOINT, {
      credentials: "include",
    });
  } catch {
    // Best effort
  }
}

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<{
    authenticated: boolean;
    admin: unknown | null;
    loading: boolean;
  }>({
    authenticated: false,
    admin: null,
    loading: true,
  });

  const loadSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const [sessionData] = await Promise.all([fetchAdminSession(), ensureCsrfToken()]);
    setState({ authenticated: sessionData.authenticated, admin: sessionData.admin, loading: false });
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    ...state,
    refreshSession: async () => {
      cachedAdminSession = null;
      await loadSession();
    },
  };
}
