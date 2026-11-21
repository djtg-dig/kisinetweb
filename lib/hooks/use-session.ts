"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionState = {
  authenticated: boolean;
  loading: boolean;
  error: boolean;
  user: unknown | null;
  refreshSession: () => Promise<void>;
};

const SESSION_CACHE_DURATION = 30 * 1000;
const CSRF_ENDPOINT = "/api/auth/csrf";
const CSRF_COOKIE_NAME = "kisinet_csrf";
let cachedSession: { data: { authenticated: boolean; user: unknown } | null; timestamp: number } | null = null;

async function fetchSession(): Promise<{ authenticated: boolean; user: unknown }> {
  if (cachedSession && Date.now() - cachedSession.timestamp < SESSION_CACHE_DURATION) {
    return cachedSession.data!;
  }

  try {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Impossible de vérifier la session.");
    }
    const data = await response.json();
    cachedSession = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    throw error;
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

export function useSession(): SessionState {
  const [state, setState] = useState<{
    authenticated: boolean;
    user: unknown | null;
    loading: boolean;
    error: boolean;
  }>({
    authenticated: false,
    user: null,
    loading: true,
    error: false,
  });

  const loadSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const [sessionData] = await Promise.all([fetchSession(), ensureCsrfToken()]);
      setState({ authenticated: sessionData.authenticated, user: sessionData.user, loading: false, error: false });
    } catch {
      // Une indisponibilité réseau ou serveur ne signifie pas une déconnexion.
      setState({ authenticated: false, user: null, loading: false, error: true });
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    ...state,
    refreshSession: async () => {
      cachedSession = null;
      await loadSession();
    },
  };
}
