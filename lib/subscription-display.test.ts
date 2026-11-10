import assert from "node:assert/strict";
import test from "node:test";

import { getSubscriptionDisplayLabel } from "./subscription-display";

test("affiche Essai avant le nom du plan BASIC", () => {
  assert.equal(
    getSubscriptionDisplayLabel({
      plan_code: "BASIC",
      status: "ACTIVE",
      is_trial_active: true,
      is_active: true,
    }),
    "Forfait Essai",
  );
});

test("affiche le libellé du forfait payé actif", () => {
  for (const [planCode, expected] of [
    ["BASIC", "Forfait Basic"],
    ["STANDARD", "Forfait Standard"],
    ["ENTERPRISE", "Forfait Entreprise"],
  ]) {
    assert.equal(
      getSubscriptionDisplayLabel({
        plan_code: planCode,
        status: "ACTIVE",
        is_trial_active: false,
        is_active: true,
      }),
      expected,
    );
  }
});

test("distingue un abonnement expiré d'un abonnement absent", () => {
  assert.equal(
    getSubscriptionDisplayLabel({
      plan_code: "STANDARD",
      status: "EXPIRED",
      is_trial_active: false,
      is_active: false,
    }),
    "Abonnement expiré",
  );
  assert.equal(getSubscriptionDisplayLabel(null), "Aucun abonnement actif");
});
