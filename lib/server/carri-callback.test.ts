import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { computeBodySha256, HMAC_HEADER_NAMES } from "@/lib/server/hmac";

const SECRET = "test-hmac-secret-for-kisinet-web";
const BACKEND_URL = "http://django.test";

type CapturedFetch = {
  url: URL;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
};

type MockCookies = {
  get: (name: string) => { value: string } | undefined;
};

type TestRequest = {
  method: string;
  headers: Headers;
  nextUrl: URL;
  cookies: MockCookies;
  url: string;
};

async function loadRoute() {
  process.env.KISINET_BACKEND_URL = BACKEND_URL;
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = SECRET;

  return import("@/app/auth/carri-callback/route");
}

function makeRequest(url: string): TestRequest {
  return {
    method: "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
    cookies: { get: () => undefined },
    url,
  };
}

function mockFetch(response: Response) {
  const calls: CapturedFetch[] = [];

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: init?.body,
    });

    return Promise.resolve(response);
  }) as typeof fetch;

  return calls;
}

function readSetCookies(response: Response): Map<string, string> {
  const headers = new Headers();
  response.headers.forEach((value, key) => headers.append(key, value));
  const raw = headers.get("set-cookie");
  const cookies = new Map<string, string>();
  if (!raw) {
    return cookies;
  }
  raw.split(/,(?=[^;]+?=)/).forEach((part) => {
    const [pair] = part.split(";");
    const [name, ...rest] = pair.split("=");
    cookies.set(name.trim(), rest.join("="));
  });
  return cookies;
}

describe("/auth/carri-callback route handler", () => {
  test("redirige vers /auth/carri?error=no_handoff quand handoff manque", async () => {
    const route = await loadRoute();
    mockFetch(Response.json({}));

    const response = await route.GET(makeRequest("http://next.test/auth/carri-callback") as never);

    assert.equal(response.status, 307);
    const location = response.headers.get("location");
    assert.equal(location, "http://next.test/auth/carri?error=no_handoff");
  });

  test("poste le handoff via HMAC sur /api/carri-account/handoff/consume/", async () => {
    const route = await loadRoute();
    const calls = mockFetch(
      Response.json({
        access: "kaccess",
        refresh: "krefresh",
        user: { id: 1 },
        carri_identity: { public_id: "US8F3K92XQW7" },
      }),
    );

    const response = await route.GET(
      makeRequest("http://next.test/auth/carri-callback?handoff=opaque-token") as never,
    );

    const call = calls[0];
    assert.ok(call);
    assert.equal(call.url.href, BACKEND_URL + "/api/carri-account/handoff/consume/");
    assert.equal(call.method, "POST");
    assert.equal(call.headers.get("X-Kisinet-Client-Id"), "kisinet-web");
    HMAC_HEADER_NAMES.forEach((name) => {
      assert.ok(call.headers.get(name), name + " doit être présent");
    });

    const bodyText = typeof call.body === "string" ? call.body : "";
    assert.equal(bodyText, JSON.stringify({ handoff: "opaque-token" }));
    assert.equal(call.headers.get("X-Kisinet-Content-SHA256"), computeBodySha256(bodyText));

    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://next.test/app/select-pharmacy");
    const cookies = readSetCookies(response);
    assert.ok(cookies.get("kisinet_access"));
    assert.ok(cookies.get("kisinet_refresh"));
    assert.ok(cookies.get("kisinet_csrf"));
  });

  test("sur 502 backend, redirige vers /auth/carri?error=callback_failed", async () => {
    const route = await loadRoute();
    mockFetch(new Response("boom", { status: 502 }));

    const response = await route.GET(
      makeRequest("http://next.test/auth/carri-callback?handoff=opaque-token") as never,
    );

    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://next.test/auth/carri?error=callback_failed");
  });

  test("sur payload sans access/refresh, redirige vers /auth/carri?error=no_tokens", async () => {
    const route = await loadRoute();
    mockFetch(Response.json({ user: { id: 1 } }));

    const response = await route.GET(
      makeRequest("http://next.test/auth/carri-callback?handoff=opaque-token") as never,
    );

    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://next.test/auth/carri?error=no_tokens");
  });
});