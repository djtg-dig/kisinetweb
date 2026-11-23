import "server-only";

import { signedBackendFetch } from "@/lib/server/backend-fetch";

export type TokenRefreshScope = "account" | "admin";

export type TokenRefreshResult =
  | { kind: "refreshed"; accessToken: string; refreshToken: string }
  | { kind: "invalid" }
  | { kind: "unavailable" };

type RefreshTokensInput = {
  scope: TokenRefreshScope;
  refreshToken: string;
  accessToken?: string;
};

const refreshesInProgress = new Map<string, Promise<TokenRefreshResult>>();

export function refreshTokens(input: RefreshTokensInput): Promise<TokenRefreshResult> {
  const key = input.scope + ":" + input.refreshToken;
  const existingRefresh = refreshesInProgress.get(key);
  if (existingRefresh) {
    return existingRefresh;
  }

  const refresh = requestTokenRefresh(input);
  refreshesInProgress.set(key, refresh);
  void refresh.finally(() => {
    if (refreshesInProgress.get(key) === refresh) {
      refreshesInProgress.delete(key);
    }
  });

  return refresh;
}

async function requestTokenRefresh({
  scope,
  refreshToken,
  accessToken,
}: RefreshTokensInput): Promise<TokenRefreshResult> {
  try {
    const response = await signedBackendFetch({
      path: scope === "admin" ? "/api/admin/auth/refresh/" : "/api/accounts/token/refresh/",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      accessToken,
      cache: "no-store",
    });

    if (!response.ok) {
      return response.status >= 500 ? { kind: "unavailable" } : { kind: "invalid" };
    }

    const data = await response.json();
    if (typeof data.access !== "string" || !data.access) {
      return { kind: "invalid" };
    }

    return {
      kind: "refreshed",
      accessToken: data.access,
      refreshToken: typeof data.refresh === "string" && data.refresh ? data.refresh : refreshToken,
    };
  } catch {
    return { kind: "unavailable" };
  }
}
