import { describe, test } from "node:test";
import assert from "node:assert/strict";

const SECRET = "test-hmac-secret-for-kisinet-web";

type TestRequest = {
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
};

async function loadRoute() {
  process.env.KISINET_BACKEND_URL = "http://django.test";
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = SECRET;

  return import("@/app/api/auth/session/route");
}

function makeRequest(cookies: Record<string, string>): TestRequest {
  return {
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  };
}

describe("/api/auth/session", () => {
  test("renouvelle une session expirée lorsque le refresh est valide", async () => {
    const route = await loadRoute();
    let sessionRequestCount = 0;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/accounts/token/refresh/")) {
        return Response.json({ access: "new-access", refresh: "new-refresh" });
      }

      sessionRequestCount += 1;
      return sessionRequestCount === 1
        ? Response.json({ detail: "Token expired" }, { status: 401 })
        : Response.json({ user: { reference: "USR-1" } });
    }) as typeof fetch;

    const response = await route.GET(makeRequest({
      kisinet_access: "expired-access",
      kisinet_refresh: "valid-refresh",
    }) as never);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      authenticated: true,
      user: { reference: "USR-1" },
    });
    assert.match(response.headers.get("set-cookie") || "", /kisinet_access=new-access/);
    assert.match(response.headers.get("set-cookie") || "", /kisinet_refresh=new-refresh/);
  });

  test("supprime la session seulement quand le refresh est réellement invalide", async () => {
    const route = await loadRoute();

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/accounts/token/refresh/")) {
        return Response.json({ detail: "Refresh token invalid" }, { status: 401 });
      }
      return Response.json({ detail: "Token expired" }, { status: 401 });
    }) as typeof fetch;

    const response = await route.GET(makeRequest({
      kisinet_access: "expired-access",
      kisinet_refresh: "invalid-refresh",
    }) as never);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { authenticated: false, user: null });
    assert.match(response.headers.get("set-cookie") || "", /Max-Age=0/);
  });
});
