import { clearApiRequestCache } from "@/lib/api-request-cache";
import { buildSafeAuthRedirect, readTokensFromHash, type AuthTokens } from "@/lib/auth-utils";

export { buildSafeAuthRedirect, readTokensFromHash };

export const ACTIVE_PHARMACY_KEY = "kisinet:active_pharmacy_id";
export const LAST_PHARMACY_KEY = ACTIVE_PHARMACY_KEY;
export const AUTH_CHANGE_EVENT_KEY = "kisinet:auth_changed";

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }
  notifyAuthChanged();
}

export function saveTokensFromUrlHash() {
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
  return "";
}

export function getRefreshToken() {
  return "";
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
  void callServerLogout();
  clearLocalSession();
  window.location.href = "/";
}

export function subscribeToAuthChanges(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === AUTH_CHANGE_EVENT_KEY) {
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
  notifyAuthChanged();
}

function notifyAuthChanged() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(AUTH_CHANGE_EVENT_KEY, String(Date.now()));
}

async function callServerLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // Best effort logout
  }
}
