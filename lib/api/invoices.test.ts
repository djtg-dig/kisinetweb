import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import { createInvoicePayment, getInvoicePaymentStatusLabel } from "./invoices.ts";
import { setApiFetchImpl } from "./request.ts";
import { ApiError, CSRF_ERROR_MESSAGE, describeApiError } from "./errors.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

afterEach(() => {
  setApiFetchImpl((input, init) => fetch(input, init));
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete (globalThis as { window?: unknown }).window;
  if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
  else delete (globalThis as { document?: unknown }).document;
});

test("le paiement de facture transmet le CSRF et conserve son payload", async () => {
  const calls: RequestInit[] = [];
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "kisinet_csrf=" + "c".repeat(64) },
    configurable: true,
  });
  setApiFetchImpl(async (_input, init) => {
    calls.push(init ?? {});
    return Response.json({ reference: "PAY123", amount_received: "12.00" }, { status: 201 });
  });

  await createInvoicePayment({
    pharmacy: "PH12345678",
    sale: "SA123",
    amount: "12.00",
    amount_received: "12.00",
    payment_method: "CASH",
    transaction_reference: "TX123",
  });

  const request = calls[0];
  assert.equal(new Headers(request?.headers).get("X-Kisinet-CSRF"), "c".repeat(64));
  assert.equal(request?.credentials, "include");
  assert.deepEqual(JSON.parse(String(request?.body)), {
    pharmacy: "PH12345678",
    sale: "SA123",
    amount: "12.00",
    amount_received: "12.00",
    payment_method: "CASH",
    transaction_reference: "TX123",
  });
});

test("un refus CSRF de paiement reste distinct d'un refus métier", async () => {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "kisinet_csrf=" + "d".repeat(64) },
    configurable: true,
  });
  setApiFetchImpl(async () => Response.json(
    { code: "csrf_failed", detail: "CSRF validation failed." },
    { status: 403 },
  ));

  await assert.rejects(
    () => createInvoicePayment({
      pharmacy: "PH12345678", sale: "SA123", amount_received: "12.00", payment_method: "CASH",
    }),
    (error: unknown) => error instanceof ApiError && describeApiError(error) === CSRF_ERROR_MESSAGE,
  );
});

test("les statuts de facture ont des libellés français stables", () => {
  assert.equal(getInvoicePaymentStatusLabel("DRAFT"), "Brouillon");
  assert.equal(getInvoicePaymentStatusLabel("UNPAID"), "Non payée");
  assert.equal(getInvoicePaymentStatusLabel("PARTIALLY_PAID"), "Partiellement payée");
  assert.equal(getInvoicePaymentStatusLabel("PAID"), "Payée");
  assert.equal(getInvoicePaymentStatusLabel("OVERPAID"), "Surpayée");
  assert.equal(getInvoicePaymentStatusLabel("CANCELED"), "Annulée");
  assert.equal(getInvoicePaymentStatusLabel("UNKNOWN"), "Inconnu");
});
