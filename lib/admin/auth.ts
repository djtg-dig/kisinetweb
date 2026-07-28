export const ADMIN_ACCESS_TOKEN_KEY = "kisinet:admin:access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "kisinet:admin:refresh_token";

export function getAdminAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) || "";
}

export function getAdminRefreshToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) || "";
}

export function saveAdminTokens(access: string, refresh: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, access);
  localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refresh);
}

export function clearAdminTokens() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
}
