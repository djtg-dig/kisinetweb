import "server-only";

export const backendServerBaseUrl =
  process.env.KISINET_BACKEND_URL ??
  "http://127.0.0.1:8002";

export const carriAccountBackendLoginUrl =
  backendServerBaseUrl.replace(/\/$/, "") + "/api/carri-account/login/";
