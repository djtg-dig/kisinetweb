import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import {
  confirmReferralWithdrawalQuote,
  getReferralWithdrawalQuote,
} from "./user-payment-accounts";
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

test("demande un devis de retrait avec le compte Mobile Money enregistré", async () => {
  installCsrfCookie();
  let sent: Record<string, unknown> | undefined;
  setApiFetchImpl(async (input, init) => {
    assert.match(String(input), /referral-withdrawals\/quote\/$/);
    sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ quote_token: "signed-quote", expires_in_seconds: 300, available_balance: "20.00", total_debited: "20.00", fee_amount: "1.60", net_payout: "18.40", minimum_amount: "1.00", maximum_amount: "20.00" });
  });

  const quote = await getReferralWithdrawalQuote({ amount: "20.00", currency: "USD", country: "CD", userPaymentAccountId: 42 });

  assert.equal(quote.netPayout, "18.40");
  assert.deepEqual(sent, { amount: "20.00", currency: "USD", country: "CD", payment_method: "MOBILE_MONEY", user_payment_account_id: 42 });
});

test("confirme le devis sans envoyer de frais calculés par le frontend", async () => {
  installCsrfCookie();
  let sent: Record<string, unknown> | undefined;
  setApiFetchImpl(async (input, init) => {
    assert.match(String(input), /referral-withdrawals\/confirm-quote\/$/);
    sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ reference: "WD12345678", status: "REQUESTED" }, { status: 201 });
  });

  const withdrawal = await confirmReferralWithdrawalQuote({ quoteToken: "signed-quote", userPaymentAccountId: 42 });

  assert.deepEqual(withdrawal, { reference: "WD12345678", status: "REQUESTED" });
  assert.deepEqual(sent, { quote_token: "signed-quote", user_payment_account_id: 42 });
});
