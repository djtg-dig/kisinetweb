import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildInvoiceCollectionPath,
  canAccessInvoiceCollection,
} from "./invoice-payment-access.ts";

test("autorise la proposition d'encaissement uniquement avec les deux permissions", () => {
  assert.equal(canAccessInvoiceCollection({ sale_view: true, sale_payment_create: true }), true);
  assert.equal(canAccessInvoiceCollection({ sale_view: true }), false);
  assert.equal(canAccessInvoiceCollection({ sale_payment_create: true }), false);
  assert.equal(canAccessInvoiceCollection({}), false);
});

test("construit le lien d'encaissement pour la bonne pharmacie et facture", () => {
  assert.equal(
    buildInvoiceCollectionPath("PH 01", "SEL/02"),
    "/app/pharmacies/PH%2001/invoices?collect=SEL%2F02",
  );
});
