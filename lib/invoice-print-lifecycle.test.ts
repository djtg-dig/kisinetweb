import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  createInvoicePrintLifecycle,
  type InvoicePrintLifecycleHost,
} from "./invoice-print-lifecycle.ts";

function createPrintHost(print: () => void): {
  host: InvoicePrintLifecycleHost;
  runNextFrame: () => void;
  emitAfterPrint: () => void;
} {
  const frameCallbacks: FrameRequestCallback[] = [];
  let afterPrintListener: (() => void) | null = null;

  return {
    host: {
      requestAnimationFrame(callback) {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      },
      cancelAnimationFrame() {},
      print,
      addEventListener(_type, listener) {
        afterPrintListener = listener;
      },
      removeEventListener() {
        afterPrintListener = null;
      },
    },
    runNextFrame() {
      const callback = frameCallbacks.shift();
      assert.ok(callback, "un cycle de rendu doit avoir été programmé");
      callback(0);
    },
    emitAfterPrint() {
      afterPrintListener?.();
    },
  };
}

test("garde le ticket monté jusqu'à l'appel unique de window.print", () => {
  let ticketIsMounted = true;
  let printCallCount = 0;
  const { host, runNextFrame } = createPrintHost(() => {
    printCallCount += 1;
    assert.equal(ticketIsMounted, true);
  });
  const lifecycle = createInvoicePrintLifecycle(host, {
    onPrintRequested() {},
    onPrintCompleted() {
      ticketIsMounted = false;
    },
    onPrintError() {},
  });

  lifecycle.start();
  lifecycle.start();
  runNextFrame();
  runNextFrame();

  assert.equal(printCallCount, 1);
  assert.equal(ticketIsMounted, true);
});

test("ferme seulement après l'événement afterprint", () => {
  let completed = 0;
  const { host, runNextFrame, emitAfterPrint } = createPrintHost(() => {});
  const lifecycle = createInvoicePrintLifecycle(host, {
    onPrintRequested() {},
    onPrintCompleted() {
      completed += 1;
    },
    onPrintError() {},
  });

  lifecycle.start();
  runNextFrame();
  runNextFrame();
  assert.equal(completed, 0);

  emitAfterPrint();
  assert.equal(completed, 1);
});

test("sans afterprint, aucune fermeture automatique n'est déclenchée", () => {
  let completed = 0;
  const { host, runNextFrame } = createPrintHost(() => {});
  const lifecycle = createInvoicePrintLifecycle(host, {
    onPrintRequested() {},
    onPrintCompleted() {
      completed += 1;
    },
    onPrintError() {},
  });

  lifecycle.start();
  runNextFrame();
  runNextFrame();

  assert.equal(completed, 0);
});

test("une nouvelle facture peut lancer son propre cycle après le précédent", () => {
  let firstPrints = 0;
  const first = createPrintHost(() => {
    firstPrints += 1;
  });
  const firstLifecycle = createInvoicePrintLifecycle(first.host, {
    onPrintRequested() {},
    onPrintCompleted() {},
    onPrintError() {},
  });
  firstLifecycle.start();
  first.runNextFrame();
  first.runNextFrame();
  first.emitAfterPrint();

  let secondPrints = 0;
  const second = createPrintHost(() => {
    secondPrints += 1;
  });
  const secondLifecycle = createInvoicePrintLifecycle(second.host, {
    onPrintRequested() {},
    onPrintCompleted() {},
    onPrintError() {},
  });
  secondLifecycle.start();
  second.runNextFrame();
  second.runNextFrame();

  assert.equal(firstPrints, 1);
  assert.equal(secondPrints, 1);
});

test("les règles d'impression isolent le portail du reste de Kisinet", () => {
  const printStyles = readFileSync("components/invoices/invoice-receipt.css", "utf8");

  assert.match(
    printStyles,
    /body\.invoice-print-preview-open > \*:not\(\.invoice-print-preview\)\s*\{\s*display: none !important;/,
  );
  assert.match(
    printStyles,
    /body\.invoice-print-preview-open \.invoice-preview-controls\s*\{\s*display: none !important;/,
  );
  assert.match(printStyles, /\.invoice-receipt\.ticket-80mm\s*\{\s*width: 76mm !important;/);
  assert.match(printStyles, /\.invoice-receipt\.ticket-58mm\s*\{\s*width: 54mm !important;/);
});
