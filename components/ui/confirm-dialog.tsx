"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !loading && onCancel()}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-xl border border-app-border bg-app-card p-6 shadow-soft"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600"
          >
            !
          </span>
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold text-app-text"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Suppression..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
