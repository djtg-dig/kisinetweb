import { clearApiRequestCache } from "@/lib/api-request-cache";
import { buildSafeAuthRedirect } from "@/lib/auth-utils";
import { csrfFetch, getCsrfTokenFromCookie } from "@/lib/csrf-fetch";

export { buildSafeAuthRedirect };

export const ACTIVE_PHARMACY_KEY = "kisinet:active_pharmacy_id";
export const LAST_PHARMACY_KEY = ACTIVE_PHARMACY_KEY;
export const AUTH_CHANGE_EVENT_KEY = "kisinet:auth_changed";

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
    await csrfFetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // Best effort logout
  }
}

export async function ensureCsrfToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  let token = getCsrfTokenFromCookie();
  if (!token) {
    try {
      const response = await fetch("/api/auth/csrf", {
        credentials: "include",
      });
      if (response.ok) {
        token = getCsrfTokenFromCookie();
      }
    } catch {
      // Best effort
    }
  }
  return token;
}
