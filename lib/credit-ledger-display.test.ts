import assert from "node:assert/strict";
import test from "node:test";

import { getCreditLedgerDisplay } from "./credit-ledger-display";

const display = (entryType: string, source = "PURCHASED", amount = 12345) =>
  getCreditLedgerDisplay({ entryType, source, amount, creditPeriod: null });

test("présente les allocations historiques sans les confondre avec un achat", () => {
  const result = display("MONTHLY_ALLOCATION", "INCLUDED", 1200);
  assert.equal(result.title, "Ancienne attribution de crédits");
  assert.equal(result.amount, "+1 200 crédits");
  assert.equal(result.direction, "credit");
});

test("présente les achats et consommations avec leur sens réel", () => {
  assert.deepEqual(display("PURCHASE"), {
    title: "Crédits IA achetés", description: "Crédits ajoutés après confirmation du paiement.", amount: "+12 345 crédits", direction: "credit",
  });
  assert.deepEqual(display("CONSUMPTION", "PURCHASED", 5), {
    title: "Analyse IA effectuée", description: "Crédits utilisés pour une analyse IA.", amount: "-5 crédits", direction: "debit",
  });
});

test("présente les expirations, remboursements et réservations distinctement", () => {
  assert.equal(display("EXPIRATION", "INCLUDED", 30).amount, "-30 crédits");
  assert.equal(display("REFUND", "PURCHASED", 30).title, "Crédits remboursés");
  assert.equal(display("RESERVED", "PURCHASED", 30).amount, "-30 crédits");
});

test("conserve un repli compréhensible lorsqu'un type est inconnu", () => {
  const result = display("MANUAL_CORRECTION", "PURCHASED", 7);
  assert.equal(result.title, "Mouvement de crédits");
  assert.equal(result.amount, "7 crédits");
  assert.equal(result.direction, "neutral");
});
