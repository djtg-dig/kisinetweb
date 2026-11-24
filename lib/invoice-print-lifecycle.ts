export type InvoicePrintLifecycleHost = {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
  print: () => void;
  addEventListener: (type: "afterprint", listener: () => void) => void;
  removeEventListener: (type: "afterprint", listener: () => void) => void;
};

type InvoicePrintLifecycleCallbacks = {
  onPrintRequested: () => void;
  onPrintCompleted: () => void;
  onPrintError: () => void;
};

export type InvoicePrintLifecycle = {
  start: () => void;
  dispose: () => void;
};

/**
 * Garde le contenu imprimable monté jusqu'au signal natif `afterprint`.
 * Aucun délai ni changement de media query ne sert de signal de fin, car ils
 * peuvent survenir avant la capture du ticket sur certains terminaux Android.
 */
export function createInvoicePrintLifecycle(
  host: InvoicePrintLifecycleHost,
  callbacks: InvoicePrintLifecycleCallbacks,
): InvoicePrintLifecycle {
  let isActive = false;
  let printWasInvoked = false;
  let isDisposed = false;
  const animationFrameHandles = new Set<number>();

  function cancelScheduledFrames() {
    animationFrameHandles.forEach((handle) => host.cancelAnimationFrame(handle));
    animationFrameHandles.clear();
  }

  function removeAfterPrintListener() {
    host.removeEventListener("afterprint", handleAfterPrint);
  }

  function reset() {
    isActive = false;
    printWasInvoked = false;
    cancelScheduledFrames();
    removeAfterPrintListener();
  }

  function handleAfterPrint() {
    // Ignore les événements sans rapport avec cette demande d'impression.
    if (!isActive || !printWasInvoked) {
      return;
    }

    reset();
    callbacks.onPrintCompleted();
  }

  function scheduleFrame(callback: FrameRequestCallback) {
    let handle = 0;
    handle = host.requestAnimationFrame((time) => {
      animationFrameHandles.delete(handle);
      callback(time);
    });
    animationFrameHandles.add(handle);
  }

  function start() {
    if (isActive || isDisposed) {
      return;
    }

    isActive = true;
    callbacks.onPrintRequested();
    host.addEventListener("afterprint", handleAfterPrint);

    // Le ticket et son code-barres ont deux cycles de rendu pour être peints
    // avant l'ouverture du dialogue natif, y compris sur Android.
    scheduleFrame(() => {
      scheduleFrame(() => {
        try {
          printWasInvoked = true;
          host.print();
        } catch {
          reset();
          callbacks.onPrintError();
        }
      });
    });
  }

  function dispose() {
    isDisposed = true;
    reset();
  }

  return { start, dispose };
}
