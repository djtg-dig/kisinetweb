import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { computeBodySha256, HMAC_HEADER_NAMES } from "@/lib/server/hmac";

const SECRET = "test-hmac-secret-for-kisinet-web";

type CapturedFetch = {
  url: URL;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
};

type TestRequest = {
  method: string;
  headers: Headers;
  nextUrl: URL;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

async function loadRoute() {
  process.env.KISINET_BACKEND_URL = "http://django.test";
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = SECRET;

  return import("@/app/api/backend/[...path]/route");
}

function makeRequest(method: string, url: string, body = new Uint8Array()): TestRequest {
  const bodyCopy = new Uint8Array(body);

  return {
    method,
    headers: new Headers(),
    nextUrl: new URL(url),
    arrayBuffer: async () =>
      bodyCopy.buffer.slice(bodyCopy.byteOffset, bodyCopy.byteOffset + bodyCopy.byteLength),
  };
}

function routeContext(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function bodyToBuffer(body: BodyInit | null | undefined): Buffer {
  if (!body) {
    return Buffer.from("");
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }
  if (typeof body === "string") {
    return Buffer.from(body);
  }
  throw new Error("Body inattendu dans le test.");
}

function mockBackend(responseFactory: () => Response | Promise<Response>) {
  const calls: CapturedFetch[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: init?.body,
    });

    return responseFactory();
  }) as typeof fetch;

  return calls;
}

describe("BFF /api/backend route handler", () => {
  test("mappe /api/backend/api/pharmacies/ vers /api/pharmacies/", async () => {
    const route = await loadRoute();
    const calls = mockBackend(() => Response.json({ ok: true }, { status: 200 }));
    const request = makeRequest("GET", "http://next.test/api/backend/api/pharmacies/?status=PAID&page=2");

    const response = await route.GET(request as never, routeContext(["api", "pharmacies"]) as never);

    assert.equal(response.status, 200);
    assert.equal(calls[0]?.url.href, "http://django.test/api/pharmacies/?status=PAID&page=2");
    assert.equal(calls[0]?.headers.get("X-Kisinet-Client-Id"), "kisinet-web");
  });

  test("supporte les méthodes principales avec les statuts backend", async () => {
    const route = await loadRoute();
    const handlers = [
      ["GET", route.GET, 200],
      ["POST", route.POST, 201],
      ["PUT", route.PUT, 200],
      ["PATCH", route.PATCH, 204],
      ["DELETE", route.DELETE, 409],
      ["HEAD", route.HEAD, 204],
    ] as const;

    for (const [method, handler, status] of handlers) {
      mockBackend(() => new Response(method === "HEAD" || status === 204 ? null : "body", { status }));
      const request = makeRequest(method, "http://next.test/api/backend/api/pharmacies/");
      const response = await handler(request as never, routeContext(["api", "pharmacies"]) as never);

      assert.equal(response.status, status);
    }
  });

  test("préserve les erreurs JSON utiles du backend", async () => {
    const route = await loadRoute();
    const statuses = [400, 401, 403, 404, 422, 429, 500];

    for (const status of statuses) {
      mockBackend(() =>
        Response.json({ code: "backend_code", detail: "Erreur backend" }, { status }),
      );
      const response = await route.GET(
        makeRequest("GET", "http://next.test/api/backend/api/test/") as never,
        routeContext(["api", "test"]) as never,
      );
      const data = await response.json();

      assert.equal(response.status, status);
      assert.deepEqual(data, { code: "backend_code", detail: "Erreur backend" });
    }
  });

  test("ne forwarde pas les headers HMAC injectés par le navigateur", async () => {
    const route = await loadRoute();
    const calls = mockBackend(() => Response.json({ ok: true }));
    const request = makeRequest("POST", "http://next.test/api/backend/api/sales/", new TextEncoder().encode("{}"));

    request.headers.set("Authorization", "Bearer user-token");
    request.headers.set("Content-Type", "application/json");
    HMAC_HEADER_NAMES.forEach((name) => request.headers.set(name, "attacker"));

    await route.POST(request as never, routeContext(["api", "sales"]) as never);

    const headers = calls[0]?.headers;
    assert.ok(headers);
    assert.equal(headers.get("Authorization"), "Bearer user-token");
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.equal(headers.get("X-Kisinet-Client-Id"), "kisinet-web");
    assert.notEqual(headers.get("X-Kisinet-Timestamp"), "attacker");
    assert.notEqual(headers.get("X-Kisinet-Nonce"), "attacker");
    assert.notEqual(headers.get("X-Kisinet-Signature"), "attacker");
  });

  test("refuse les chemins SSRF et traversal à la frontière Route Handler", async () => {
    const route = await loadRoute();
    const invalidCases = [
      ["http://evil.test"],
      ["https://evil.test"],
      ["", "", "evil.test"],
      ["..", "admin"],
      ["..", "..", "secret"],
      ["%2e%2e", "admin"],
      ["%252e%252e", "admin"],
      ["%2f%2fevil.test"],
      ["%252f%252fevil.test"],
      ["..\\admin"],
      ["http:", "evil.test"],
      ["user@host"],
    ];

    for (const path of invalidCases) {
      const calls = mockBackend(() => Response.json({ ok: true }));
      const response = await route.GET(
        makeRequest("GET", "http://next.test/api/backend/api/" + path.join("/") + "/") as never,
        routeContext(["api", ...path]) as never,
      );

      assert.equal(response.status, 502);
      assert.equal(calls.length, 0);
    }
  });

  test("relaie les réponses PDF et Excel sans changer les bytes", async () => {
    const route = await loadRoute();
    const cases = [
      {
        contentType: "application/pdf",
        disposition: 'attachment; filename="test.pdf"',
        bytes: new Uint8Array([37, 80, 68, 70]),
      },
      {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        disposition: 'attachment; filename="test.xlsx"',
        bytes: new Uint8Array([80, 75, 3, 4]),
      },
    ];

    for (const file of cases) {
      mockBackend(
        () =>
          new Response(file.bytes, {
            status: 201,
            headers: {
              "Content-Type": file.contentType,
              "Content-Disposition": file.disposition,
            },
          }),
      );

      const response = await route.GET(
        makeRequest("GET", "http://next.test/api/backend/api/export/") as never,
        routeContext(["api", "export"]) as never,
      );
      const bytes = new Uint8Array(await response.arrayBuffer());

      assert.equal(response.status, 201);
      assert.equal(response.headers.get("Content-Type"), file.contentType);
      assert.equal(response.headers.get("Content-Disposition"), file.disposition);
      assert.deepEqual([...bytes], [...file.bytes]);
    }
  });

  test("signe et transmet les mêmes octets multipart avec la boundary originale", async () => {
    const route = await loadRoute();
    const calls = mockBackend(() => Response.json({ ok: true }));
    const multipart = new TextEncoder().encode(
      [
        "--kisinet-boundary",
        'Content-Disposition: form-data; name="pharmacy_reference"',
        "",
        "PH123",
        "--kisinet-boundary--",
        "",
      ].join("\r\n"),
    );
    const request = makeRequest("POST", "http://next.test/api/backend/api/sales/vision/", multipart);

    request.headers.set("Content-Type", "multipart/form-data; boundary=kisinet-boundary");
    await route.POST(request as never, routeContext(["api", "sales", "vision"]) as never);

    const call = calls[0];
    assert.ok(call);
    assert.deepEqual([...bodyToBuffer(call.body)], [...multipart]);
    assert.equal(call.headers.get("Content-Type"), "multipart/form-data; boundary=kisinet-boundary");
    assert.equal(call.headers.get("X-Kisinet-Content-SHA256"), computeBodySha256(multipart));
  });

  test("deux passages BFF successifs génèrent un nouveau nonce et une nouvelle signature", async () => {
    const route = await loadRoute();
    const calls = mockBackend(() => Response.json({ ok: true }));

    await route.GET(
      makeRequest("GET", "http://next.test/api/backend/api/pharmacies/") as never,
      routeContext(["api", "pharmacies"]) as never,
    );
    await route.GET(
      makeRequest("GET", "http://next.test/api/backend/api/pharmacies/") as never,
      routeContext(["api", "pharmacies"]) as never,
    );

    assert.equal(calls.length, 2);
    assert.notEqual(
      calls[0]?.headers.get("X-Kisinet-Nonce"),
      calls[1]?.headers.get("X-Kisinet-Nonce"),
    );
    assert.notEqual(
      calls[0]?.headers.get("X-Kisinet-Signature"),
      calls[1]?.headers.get("X-Kisinet-Signature"),
    );
  });
});
