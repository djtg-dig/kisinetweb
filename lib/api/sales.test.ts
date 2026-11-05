import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import { ApiError, AI_UNAVAILABLE_MESSAGE, describeApiError } from "./errors.ts";
import { analyzePrescription, createSale, uploadPrescriptionCapture } from "./sales.ts";
import { setApiFetchImpl } from "./request.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

afterEach(() => {
  setApiFetchImpl((input, init) => fetch(input, init));
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    delete (globalThis as { window?: unknown }).window;
  }
  if (originalDocument) {
    Object.defineProperty(globalThis, "document", originalDocument);
  } else {
    delete (globalThis as { document?: unknown }).document;
  }
});

function image(): Blob {
  return new Blob(["test-image"], { type: "image/jpeg" });
}

test("analyse une ordonnance réussie", async () => {
  setApiFetchImpl(async () => Response.json({
    medications: [{ raw_name: "Paracétamol", strength: "500 mg", prescribed_quantity: "1", reading_score: 90 }],
  }));

  const medications = await analyzePrescription("PH12345678", image());
  assert.equal(medications[0]?.rawName, "Paracétamol");
});

for (const [label, response] of [
  ["502 JSON", Response.json({ code: "AI_PROVIDER_ERROR", detail: "provider internal" }, { status: 502 })],
  ["502 HTML", new Response("<html>Cloudflare detail</html>", { status: 502, headers: { "Content-Type": "text/html" } })],
  ["503", Response.json({}, { status: 503 })],
  ["504 vide", new Response(null, { status: 504 })],
] as const) {
  test(`normalise ${label} en indisponibilité IA sans détail technique`, async () => {
    setApiFetchImpl(async () => response);

    await assert.rejects(
      () => analyzePrescription("PH12345678", image()),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.code, "AI_PROVIDER_ERROR");
        assert.equal(describeApiError(error), AI_UNAVAILABLE_MESSAGE);
        return true;
      },
    );
  });
}

test("normalise un timeout réseau du scan en indisponibilité IA", async () => {
  setApiFetchImpl(async () => { throw new TypeError("fetch failed"); });

  await assert.rejects(
    () => analyzePrescription("PH12345678", image()),
    (error: unknown) => error instanceof ApiError && describeApiError(error) === AI_UNAVAILABLE_MESSAGE,
  );
});

test("normalise un corps de réponse interrompu en indisponibilité IA", async () => {
  setApiFetchImpl(async () => ({
    ok: false,
    status: 502,
    text: async () => { throw new TypeError("stream interrupted"); },
  }) as Response);

  await assert.rejects(
    () => analyzePrescription("PH12345678", image()),
    (error: unknown) => error instanceof ApiError && describeApiError(error) === AI_UNAVAILABLE_MESSAGE,
  );
});

test("préserve les crédits insuffisants et les permissions", async () => {
  for (const [status, code, detail] of [
    [402, "USER_CREDIT_EXHAUSTED", "Crédits insuffisants."],
    [403, "permission_denied", "Accès refusé."],
  ] as const) {
    setApiFetchImpl(async () => Response.json({ code, detail }, { status }));
    await assert.rejects(
      () => analyzePrescription("PH12345678", image()),
      (error: unknown) => error instanceof ApiError && error.code === code && error.message === detail,
    );
  }
});

test("la capture transmet la référence de pharmacie et le CSRF", async () => {
  const calls: RequestInit[] = [];
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "kisinet_csrf=" + "a".repeat(64) },
    configurable: true,
  });
  setApiFetchImpl(async (_input, init) => {
    calls.push(init ?? {});
    return Response.json({}, { status: 201 });
  });

  await uploadPrescriptionCapture("PH12345678", image());

  const request = calls[0];
  assert.ok(request?.body instanceof FormData);
  assert.equal((request?.body as FormData).get("pharmacy_reference"), "PH12345678");
  assert.equal((request?.body as FormData).get("pharmacy"), null);
  assert.equal(new Headers(request?.headers).get("X-Kisinet-CSRF"), "a".repeat(64));
  assert.equal(request?.credentials, "include");
});

test("la création de vente transmet le CSRF et les cookies de session", async () => {
  const calls: RequestInit[] = [];
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "kisinet_csrf=" + "b".repeat(64) },
    configurable: true,
  });
  setApiFetchImpl(async (_input, init) => {
    calls.push(init ?? {});
    return Response.json({ reference: "SA123", pharmacy: "PH12345678", items: [] }, { status: 201 });
  });

  await createSale({
    pharmacyReference: "PH12345678",
    items: [{ productReference: "PR123", quantity: 1, unitPrice: 12 }],
  });

  const request = calls[0];
  assert.equal(new Headers(request?.headers).get("X-Kisinet-CSRF"), "b".repeat(64));
  assert.equal(request?.credentials, "include");
  assert.deepEqual(JSON.parse(String(request?.body)), {
    pharmacy: "PH12345678",
    customer_name: "",
    customer_phone: "",
    discount_amount: "0",
    items: [{ pharmacy: "PH12345678", product: "PR123", quantity: 1 }],
  });
});
