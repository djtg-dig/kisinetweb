export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8002";

export const carriAccountLoginUrl =
  apiBaseUrl.replace(/\/$/, "") + "/api/carri-account/login/";
