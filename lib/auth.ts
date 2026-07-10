export const ACCESS_TOKEN_KEY = "kisinet:access_token";
export const REFRESH_TOKEN_KEY = "kisinet:refresh_token";
export const ACTIVE_PHARMACY_KEY = "kisinet:active_pharmacy_id";
export const LAST_PHARMACY_KEY = ACTIVE_PHARMACY_KEY;

export function saveTokensFromUrlHash() {
  // Carri/Kisinet renvoie les tokens dans le fragment URL: #access=...&refresh=...
  if (typeof window === "undefined" || !window.location.hash) {
    return;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const access = params.get("access");
  const refresh = params.get("refresh");

  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  // On nettoie l URL pour ne pas laisser les tokens visibles.
  if (access || refresh) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
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

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_PHARMACY_KEY);

  window.location.href = "/";
}
