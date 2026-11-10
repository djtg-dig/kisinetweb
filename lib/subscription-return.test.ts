import assert from "node:assert/strict";
import test from "node:test";

import type { PharmacySubscriptionPayment } from "@/lib/api";
import {
  findPaymentByProviderReference,
  getSubscriptionReturnState,
} from "@/lib/subscription-return";

const payment = (overrides: Partial<PharmacySubscriptionPayment> = {}): PharmacySubscriptionPayment => ({
  id: 1,
  planCode: "BASIC",
  durationMonths: 1,
  amount: "1.00",
  currency: "USD",
  status: "PENDING",
  reference: "PT123",
  orderId: "PT123",
  ...overrides,
});

test("maps backend payment statuses without trusting the browser return status", () => {
  assert.equal(getSubscriptionReturnState("VALIDATED"), "success");
  assert.equal(getSubscriptionReturnState("PAID"), "success");
  assert.equal(getSubscriptionReturnState("PENDING"), "pending");
  assert.equal(getSubscriptionReturnState("FAILED"), "failed");
  assert.equal(getSubscriptionReturnState("CANCELED"), "cancelled");
  assert.equal(getSubscriptionReturnState("REFUNDED"), "pending");
});

test("matches the OPTGateway session only against provider_reference", () => {
  const result = findPaymentByProviderReference(
    [payment({ reference: "PT-session", providerReference: "cs_live_123" })],
    "cs_live_123",
  );

  assert.equal(result?.reference, "PT-session");
  assert.equal(findPaymentByProviderReference([payment({ reference: "PT123" })], "PT123"), undefined);
});
