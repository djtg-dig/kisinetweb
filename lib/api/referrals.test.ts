import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import { createReferralWithdrawal, getReferralWithdrawal } from "./referrals";
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

test("soumet explicitement le retrait pawaPay sans calculer les frais", async () => {
  installCsrfCookie();
  let sent: Record<string, unknown> | undefined;
  setApiFetchImpl(async (_input, init) => {
    sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ reference: "WDR123", status: "PROCESSING" }, { status: 201 });
  });

  const withdrawal = await createReferralWithdrawal({
    amount: "5.00", currency: "USD", country: "CD", phone_number: "+243999123456",
    operator: "AIRTEL_COD", provider_code: "PAWAPAY",
  });

  assert.equal(withdrawal.status, "PROCESSING");
  assert.deepEqual(sent, {
    amount: "5.00", currency: "USD", country: "CD", phone_number: "+243999123456",
    operator: "AIRTEL_COD", provider_code: "PAWAPAY",
  });
});

test("consulte le statut du retrait sans soumettre une nouvelle demande", async () => {
  let method = "";
  let url = "";
  setApiFetchImpl(async (input, init) => {
    url = String(input);
    method = init?.method || "GET";
    return Response.json({ reference: "WDR123", status: "PAID" });
  });

  const withdrawal = await getReferralWithdrawal("WDR123");
  assert.equal(withdrawal.status, "PAID");
  assert.equal(method, "GET");
  assert.match(url, /\/api\/paiements\/referral-withdrawals\/WDR123\/$/);
});
