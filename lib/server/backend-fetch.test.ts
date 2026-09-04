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

async function loadBackendFetch() {
  process.env.KISINET_BACKEND_URL = BACKEND_URL;
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = SECRET;

  return import("@/lib/server/backend-fetch");
}

function bodyToBuffer(body: BodyInit | null | undefined): Buffer {
  if (!body) {
    return Buffer.from("");
  }
  if (typeof body === "string") {
    return Buffer.from(body);
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }
  throw new Error("Body inattendu dans le test.");
}

function mockFetch(response = new Response("ok")) {
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

describe("signedBackendFetch", () => {
  test("appelle Django avec URL, méthode, body, Authorization et HMAC", async () => {
    const { signedBackendFetch } = await loadBackendFetch();
    const calls = mockFetch();
    const body = JSON.stringify({ amount: 100, currency: "USD" });

    await signedBackendFetch({
      path: "/api/invoices/?status=PAID&page=2",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Kisinet-Client-Id": "attacker",
        "X-Kisinet-Signature": "fake",
      },
      body,
      accessToken: "user-token",
    });

    const call = calls[0];
    assert.ok(call);
    assert.equal(call.url.href, "http://django.test/api/invoices/?status=PAID&page=2");
    assert.equal(call.method, "POST");
    assert.equal(call.headers.get("Authorization"), "Bearer user-token");
    assert.equal(call.headers.get("Accept"), "application/json");
    assert.equal(call.headers.get("Content-Type"), "application/json");
    assert.equal(call.headers.get("X-Kisinet-Client-Id"), "kisinet-web");
    assert.notEqual(call.headers.get("X-Kisinet-Signature"), "fake");

    HMAC_HEADER_NAMES.forEach((name) => {
      assert.ok(call.headers.get(name), name + " doit être présent");
    });
  });

  test("hash le même body JSON que celui transmis", async () => {
    const { signedBackendFetch } = await loadBackendFetch();
    const calls = mockFetch();
    const body = '{"amount":100,"currency":"USD"}';

    await signedBackendFetch({
      path: "/api/invoices/",
      method: "POST",
      body,
    });

    const call = calls[0];
    assert.ok(call);
    assert.equal(bodyToBuffer(call.body).toString("utf8"), body);
    assert.equal(call.headers.get("X-Kisinet-Content-SHA256"), computeBodySha256(body));
  });

  test("hash et transmet exactement un ArrayBuffer", async () => {
    const { signedBackendFetch } = await loadBackendFetch();
    const calls = mockFetch();
    const bytes = new Uint8Array([0, 1, 2, 3, 255]);

    await signedBackendFetch({
      path: "/api/upload/",
      method: "PATCH",
      body: bytes,
    });

    const call = calls[0];
    assert.ok(call);
    assert.deepEqual([...bodyToBuffer(call.body)], [...bytes]);
    assert.equal(call.headers.get("X-Kisinet-Content-SHA256"), computeBodySha256(bytes));
  });

  test("signe un body vide pour GET et n'envoie pas de body", async () => {
    const { signedBackendFetch } = await loadBackendFetch();
    const calls = mockFetch();

    await signedBackendFetch({
      path: "/api/pharmacies/",
      method: "GET",
      body: "ignored",
    });

    const call = calls[0];
    assert.ok(call);
    assert.equal(call.body, null);
    assert.equal(call.headers.get("X-Kisinet-Content-SHA256"), computeBodySha256(null));
  });

  test("rejette les chemins SSRF et traversal", async () => {
    const { normalizeBackendPath } = await loadBackendFetch();
    const invalidPaths = [
      "",
      "http://evil.test",
      "https://evil.test",
      "//evil.test",
      "/admin/",
      "/api/../admin/",
      "/api/%2e%2e/admin/",
      "/api/%2f%2fevil.test/",
      "/api/..\\admin/",
      "/api/http:/evil.test/",
      "/api/user@host/",
      "user@host",
    ];

    invalidPaths.forEach((path) => {
      assert.throws(() => normalizeBackendPath(path), /Chemin backend/);
    });

    assert.equal(normalizeBackendPath("/api/pharmacies/?page=2"), "/api/pharmacies/?page=2");
  });
});
