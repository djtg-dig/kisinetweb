"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionState = {
  authenticated: boolean;
  loading: boolean;
  user: unknown | null;
  refreshSession: () => Promise<void>;
};

const SESSION_CACHE_DURATION = 30 * 1000;
let cachedSession: { data: { authenticated: boolean; user: unknown } | null; timestamp: number } | null = null;

async function fetchSession(): Promise<{ authenticated: boolean; user: unknown }> {
  if (cachedSession && Date.now() - cachedSession.timestamp < SESSION_CACHE_DURATION) {
    return cachedSession.data!;
  }

  try {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
    });
    const data = await response.json();
    cachedSession = { data, timestamp: Date.now() };
    return data;
  } catch {
    return { authenticated: false, user: null };
  }
}

export function useSession(): SessionState {
  const [state, setState] = useState<{
    authenticated: boolean;
    user: unknown | null;
    loading: boolean;
  }>({
    authenticated: false,
    user: null,
    loading: true,
  });

  const loadSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const data = await fetchSession();
    setState({ authenticated: data.authenticated, user: data.user, loading: false });
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
