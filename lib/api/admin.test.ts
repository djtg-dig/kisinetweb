import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import {
  getAdminReferralWithdrawalSummary,
  transitionAdminReferralWithdrawal,
} from "./admin";
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

test("charge les indicateurs de retrait sans télécharger toutes les demandes", async () => {
  let url = "";
  setApiFetchImpl(async (input) => {
    url = String(input);
    return Response.json({
      requested_count: 2,
      processing_count: 1,
      rejected_count: 3,
      pending_totals: [{ currency: "USD", amount: "15.00" }],
      paid_totals: [{ currency: "CDF", amount: "30000.00" }],
    });
  });

  const summary = await getAdminReferralWithdrawalSummary();
  assert.equal(summary.processing_count, 1);
  assert.match(url, /\/api\/admin\/referral-withdrawals\/summary\/$/);
});

test("confirme un retrait manuel avec les seules métadonnées administratives", async () => {
  installCsrfCookie();
  let url = "";
  let sent: Record<string, unknown> | undefined;
  setApiFetchImpl(async (input, init) => {
    url = String(input);
    sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ reference: "WD123", status: "PAID" });
  });

  await transitionAdminReferralWithdrawal("WD123", "paid", {
    provider_reference: "MOMO-123",
    provider_metadata: {
      transfer_date: "2026-11-21",
      payment_method: "MOBILE_MONEY",
      administrative_note: "Vérifié.",
    },
  });

  assert.match(url, /\/api\/admin\/referral-withdrawals\/WD123\/paid\/$/);
  assert.deepEqual(sent, {
    provider_reference: "MOMO-123",
    provider_metadata: {
      transfer_date: "2026-11-21",
      payment_method: "MOBILE_MONEY",
      administrative_note: "Vérifié.",
    },
  });
});
