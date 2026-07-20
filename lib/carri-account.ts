export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8002";

export const carriAccountBackendLoginUrl =
  apiBaseUrl.replace(/\/$/, "") + "/api/carri-account/login/";

export const carriAccountLoginUrl = "/auth/carri";
