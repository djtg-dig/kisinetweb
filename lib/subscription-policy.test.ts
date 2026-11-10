import assert from "node:assert/strict";
import test from "node:test";

import type { PharmacySummary } from "@/lib/api";
import { getSubscriptionPurchaseError, isPaidSubscriptionActive } from "@/lib/subscription-policy";

function pharmacy(overrides: Partial<PharmacySummary> = {}): PharmacySummary {
  return {
    id: "PH00000001",
    name: "Pharmacie test",
    planName: "BASIC",
    subscriptionStatus: "ACTIVE",
    subscriptionExpiresAt: "2099-01-01T00:00:00Z",
    ...overrides,
  };
}

test("an active trial is not treated as a paid subscription purchase", () => {
  const activeTrial = pharmacy({ subscriptionIsTrialActive: true });

  assert.equal(isPaidSubscriptionActive(activeTrial), false);
  assert.equal(getSubscriptionPurchaseError(activeTrial, "BASIC"), "");
});

test("an active paid subscription still blocks same-plan and downgrade purchases", () => {
  const paidStandard = pharmacy({
    planName: "STANDARD",
    subscriptionIsTrialActive: false,
  });

  assert.match(getSubscriptionPurchaseError(paidStandard, "STANDARD"), /déjà/i);
  assert.match(getSubscriptionPurchaseError(paidStandard, "BASIC"), /inférieur/i);
  assert.equal(getSubscriptionPurchaseError(paidStandard, "ENTERPRISE"), "");
});
