import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import { createCreditPurchase } from "./billing";
import { setApiFetchImpl } from "./request";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

afterEach(() => {
  setApiFetchImpl((input, init) => fetch(input, init));
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete (globalThis as { window?: unknown }).window;
  if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
  else delete (globalThis as { document?: unknown }).document;
});

function installCsrfCookie() {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "kisinet_csrf=" + "a".repeat(64) }, configurable: true,
  });
}

test("initie un achat de crédits pawaPay sans créditer le portefeuille", async () => {
  installCsrfCookie();
  let sent: Record<string, unknown> | undefined;
  setApiFetchImpl(async (_input, init) => {
    sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ payment_reference: "PAYCREDIT123", status: "PENDING" }, { status: 201 });
  });

  const result = await createCreditPurchase("PH12345678", {
    packId: 7,
    providerCode: "PAWAPAY",
    country: "cd",
    phoneNumber: "+243 999 123 456",
    operator: "airtel_cod",
  });

  assert.deepEqual(result, { paymentReference: "PAYCREDIT123", status: "PENDING" });
  assert.deepEqual(sent, {
    pack_id: 7,
    pharmacy_reference: "PH12345678",
    provider_code: "PAWAPAY",
    country: "CD",
    phone_number: "+243 999 123 456",
    operator: "AIRTEL_COD",
  });
});

test("refuse une initiation pawaPay incomplète avant tout appel réseau", async () => {
  await assert.rejects(
    () => createCreditPurchase("PH12345678", { packId: 7, providerCode: "PAWAPAY" }),
    /Mobile Money sont requis/,
  );
});
