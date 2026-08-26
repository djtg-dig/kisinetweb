import { clearApiRequestCache } from "@/lib/api-request-cache";
import { apiFetch } from "@/lib/api/request";
import { apiBaseUrl } from "@/lib/carri-account";
import {
  buildSafeAuthRedirect,
  readTokensFromHash,
  type AuthTokens,
} from "@/lib/auth-utils";

export { buildSafeAuthRedirect, readTokensFromHash };

export const ACCESS_TOKEN_KEY = "kisinet:access_token";
export const REFRESH_TOKEN_KEY = "kisinet:refresh_token";
export const ACTIVE_PHARMACY_KEY = "kisinet:active_pharmacy_id";
export const LAST_PHARMACY_KEY = ACTIVE_PHARMACY_KEY;
export const AUTH_CHANGE_EVENT_KEY = "kisinet:auth_changed";

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  notifyAuthChanged();
}

export function saveTokensFromUrlHash() {
  // Kisinet renvoie les tokens dans le fragment URL: #access=...&refresh=...
  if (typeof window === "undefined" || !window.location.hash) {
    return false;
  }

  const tokens = readTokensFromHash(window.location.hash);
  if (!tokens) {
    return false;
  }

  saveTokens(tokens);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function getActivePharmacyId() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ACTIVE_PHARMACY_KEY) || "";
}

export function setActivePharmacyId(pharmacyId: string) {
  if (typeof window === "undefined" || !pharmacyId) {
    return;
  }

  localStorage.setItem(ACTIVE_PHARMACY_KEY, pharmacyId);
}

export function clearActivePharmacyId() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACTIVE_PHARMACY_KEY);
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (accessToken && refreshToken) {
    void revokeServerSession(accessToken, refreshToken);
  }

  clearLocalSession();
  window.location.href = "/";
}

export function subscribeToAuthChanges(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (
      event.key === AUTH_CHANGE_EVENT_KEY ||
      event.key === ACCESS_TOKEN_KEY ||
      event.key === REFRESH_TOKEN_KEY
    ) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

function clearLocalSession() {
  clearApiRequestCache();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_PHARMACY_KEY);
  notifyAuthChanged();
}

function notifyAuthChanged() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_CHANGE_EVENT_KEY, String(Date.now()));
}

async function revokeServerSession(accessToken: string, refreshToken: string) {
  try {
    await apiFetch(apiBaseUrl.replace(/\/$/, "") + "/api/accounts/logout/", {
      method: "POST",
      cache: "no-store",
      keepalive: true,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    // Déconnexion best-effort : l'utilisateur doit toujours être déconnecté
    // localement, même si le backend ou le réseau est indisponible.
  }
}
