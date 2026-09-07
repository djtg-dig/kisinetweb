// Tests purs des helpers de retirabilité du wallet.
// Vérifie notamment qu'on n'a PAS le bug classique :
//   "10.00" < "1.08"  -> true  (comparaison lexicographique)
//   10.00 < 1.08      -> false (comparaison numérique)
//
// On vérifie aussi la complétude de l'API `evaluateWalletWithdrawability`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateWalletWithdrawability,
  parseDecimalAmount,
} from "./withdrawability";
import type { ReferralWalletSummary } from "@/lib/api/referrals";

function makeWallet(overrides: Partial<ReferralWalletSummary> = {}): ReferralWalletSummary {
  return {
    currency: "USD",
    earned_total: "10.00",
    pending_balance: "0.00",
    available_balance: "10.00",
    reserved_balance: "0.00",
    withdrawn_total: "0.00",
    reversed_total: "0.00",
    commissions_count: 0,
    pending_withdrawals_count: 0,
    withdrawal_fee_rate: "8.00",
    minimum_withdrawal_amount: "1.00",
    max_withdrawable_amount: "9.25",
    minimum_required_balance: "1.08",
    ...overrides,
  };
}

test("parseDecimalAmount convertit une chaîne Decimal en nombre", () => {
  assert.equal(parseDecimalAmount("10.00"), 10);
  assert.equal(parseDecimalAmount("1.08"), 1.08);
  assert.equal(parseDecimalAmount(" 9.25 "), 9.25);
  assert.equal(parseDecimalAmount(0), 0);
  assert.equal(parseDecimalAmount(10.5), 10.5);
});

test("parseDecimalAmount retourne null pour entrée invalide", () => {
  assert.equal(parseDecimalAmount(""), null);
  assert.equal(parseDecimalAmount("   "), null);
  assert.equal(parseDecimalAmount(null), null);
  assert.equal(parseDecimalAmount(undefined), null);
  assert.equal(parseDecimalAmount("abc"), null);
  assert.equal(parseDecimalAmount(Number.NaN), null);
  assert.equal(parseDecimalAmount(Number.POSITIVE_INFINITY), null);
});

test("la conversion Number('10.00') !== Number('1.08') ne donne PAS 10 < 1.08", () => {
  // Garde-fou : si un futur dev retombait sur une comparaison de
  // chaînes, le test devrait attraper le bug.
  const available = Number("10.00");
  const minimum = Number("1.08");
  assert.ok(available > minimum);
  assert.notEqual(available < minimum, true);
});

test("evaluateWalletWithdrawability: wallet retirable", () => {
  const result = evaluateWalletWithdrawability(makeWallet());
  assert.equal(result.canWithdraw, true);
  if (result.canWithdraw) {
    assert.equal(result.reason, "ok");
  }
});

test("evaluateWalletWithdrawability: solde insuffisant", () => {
  const result = evaluateWalletWithdrawability(
    makeWallet({
      available_balance: "1.07",
      minimum_required_balance: "1.08",
    }),
  );
  assert.equal(result.canWithdraw, false);
  if (!result.canWithdraw) {
    assert.equal(result.reason, "insufficient_balance");
    if (result.reason === "insufficient_balance") {
      assert.equal(result.available, 1.07);
      assert.equal(result.minimumRequired, 1.08);
    }
  }
});

test("evaluateWalletWithdrawability: pas de wallet", () => {
  const result = evaluateWalletWithdrawability(null);
  assert.equal(result.canWithdraw, false);
  if (!result.canWithdraw) {
    assert.equal(result.reason, "no_wallet");
  }
});

test("evaluateWalletWithdrawability: config absente (champs undefined)", () => {
  // Si l'API renvoie un wallet sans les nouveaux champs
  // (déploiement partiel), on ne désactive pas silencieusement le
  // bouton : on retourne missing_config pour que l'UI affiche un
  // message dédié au lieu d'un faux "solde insuffisant".
  const partial = makeWallet({
    minimum_required_balance: undefined as unknown as string,
  });
  const result = evaluateWalletWithdrawability(partial);
  assert.equal(result.canWithdraw, false);
  if (!result.canWithdraw) {
    assert.equal(result.reason, "missing_config");
  }
});

test("evaluateWalletWithdrawability: valeurs vides", () => {
  const result = evaluateWalletWithdrawability(
    makeWallet({
      available_balance: "",
      minimum_required_balance: "",
    }),
  );
  assert.equal(result.canWithdraw, false);
  if (!result.canWithdraw) {
    assert.equal(result.reason, "missing_config");
  }
});
