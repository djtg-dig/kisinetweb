import assert from "node:assert/strict";
import { test } from "node:test";

import { getReceiptCustomerInfo } from "./invoice-receipt-customer.ts";

test("affiche le nom et le téléphone d'un client renseigné", () => {
  assert.deepEqual(
    getReceiptCustomerInfo("Jean Mbuyi", "+243 812345678"),
    { name: "Jean Mbuyi", phone: "+243 812345678" },
  );
});

test("affiche uniquement le nom lorsque le téléphone est vide", () => {
  assert.deepEqual(getReceiptCustomerInfo("Jean Mbuyi", "  "), {
    name: "Jean Mbuyi",
    phone: null,
  });
});

test("masque le client lorsque son nom est absent, même avec un téléphone", () => {
  assert.equal(getReceiptCustomerInfo("", "+243 812345678"), null);
  assert.equal(getReceiptCustomerInfo("   ", "+243 812345678"), null);
  assert.equal(getReceiptCustomerInfo(undefined, undefined), null);
});

test("préserve un nom long pour que le ticket le replie dans sa largeur", () => {
  const name = "Jean Baptiste Mbuyi Kabeya avec un nom volontairement très long";
  assert.deepEqual(getReceiptCustomerInfo(name, "+243 812345678"), {
    name,
    phone: "+243 812345678",
  });
});
