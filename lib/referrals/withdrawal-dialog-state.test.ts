import { test } from "node:test";
import assert from "node:assert/strict";

import {
  getQuoteBlockReason,
  isWithdrawalAmountValid,
} from "@/components/referrals/WithdrawalDialog";

test("explique pourquoi le devis est indisponible tant que les comptes chargent", () => {
  assert.equal(
    getQuoteBlockReason({
      accountsState: "loading",
      hasActiveAccount: false,
      amountValid: true,
      isQuoting: false,
    }),
    "Vos comptes Mobile Money sont en cours de chargement.",
  );
});

test("bloque le devis sans compte actif ou lorsque le chargement échoue", () => {
  assert.match(
    getQuoteBlockReason({
      accountsState: "ready",
      hasActiveAccount: false,
      amountValid: true,
      isQuoting: false,
    }) || "",
    /Ajoutez ou activez un compte Mobile Money/,
  );
  assert.match(
    getQuoteBlockReason({
      accountsState: "error",
      hasActiveAccount: true,
      amountValid: true,
      isQuoting: false,
    }) || "",
    /doivent être chargés/,
  );
});

test("autorise le devis avec un compte actif et un montant valide", () => {
  assert.equal(
    getQuoteBlockReason({
      accountsState: "ready",
      hasActiveAccount: true,
      amountValid: true,
      isQuoting: false,
    }),
    null,
  );
});

test("refuse les montants hors des limites du retrait", () => {
  assert.equal(isWithdrawalAmountValid(0.009, 0.01, 0.11), false);
  assert.equal(isWithdrawalAmountValid(0.12, 0.01, 0.11), false);
  assert.equal(isWithdrawalAmountValid(0.11, 0.01, 0.11), true);
});
