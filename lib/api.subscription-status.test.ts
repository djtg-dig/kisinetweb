import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import { getPharmacySubscriptionStatus } from "@/lib/api";
import { setApiFetchImpl } from "@/lib/api/request";

afterEach(() => {
  setApiFetchImpl((input, init) => fetch(input, init));
});

test("lit le statut d'abonnement de la pharmacie demandée", async () => {
  let requestedUrl = "";
  setApiFetchImpl(async (input) => {
    requestedUrl = String(input);
    return Response.json({
      pharmacy_reference: "PH12345678",
      plan_code: "STANDARD",
      plan_name: "Standard",
      status: "ACTIVE",
      effective_status: "TRIAL",
      duration_months: 1,
      duration_days: 30,
      starts_at: "10-11-2026 10:00:00",
      expires_at: "10-12-2026 10:00:00",
      days_remaining: 24,
      last_confirmed_payment: {
        confirmed_at: "10-11-2026 10:00:00",
        amount: "5.00",
        currency: "USD",
      },
    });
  });

  const subscription = await getPharmacySubscriptionStatus("PH12345678");

  const url = new URL(requestedUrl, "http://test.local");
  assert.equal(url.pathname, "/api/backend/api/paiements/pharmacy-subscriptions/status/");
  assert.equal(url.searchParams.get("pharmacy_reference"), "PH12345678");
  assert.deepEqual(subscription, {
    pharmacyReference: "PH12345678",
    planCode: "STANDARD",
    planName: "Standard",
    status: "ACTIVE",
    effectiveStatus: "TRIAL",
    durationMonths: 1,
    durationDays: 30,
    startsAt: "10-11-2026 10:00:00",
    expiresAt: "10-12-2026 10:00:00",
    daysRemaining: 24,
    lastConfirmedPayment: {
      confirmedAt: "10-11-2026 10:00:00",
      amount: "5.00",
      currency: "USD",
    },
  });
});

test("conserve l'absence de paiement confirmé", async () => {
  setApiFetchImpl(async () => Response.json({
    pharmacy_reference: "PH12345678",
    plan_code: "BASIC",
    plan_name: "Basic",
    status: "ACTIVE",
    effective_status: "TRIAL",
    duration_months: 1,
    duration_days: 90,
    starts_at: "10-11-2026 10:00:00",
    expires_at: "08-02-2027 10:00:00",
    days_remaining: 84,
    last_confirmed_payment: null,
  }));

  const subscription = await getPharmacySubscriptionStatus("PH12345678");

  assert.equal(subscription.lastConfirmedPayment, null);
  assert.equal(subscription.effectiveStatus, "TRIAL");
});
