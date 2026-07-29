"use client";

import { useEffect } from "react";

type ToastTone = "error" | "success" | "info";

type ToastMessageProps = {
  tone?: ToastTone;
  children: React.ReactNode;
  onClose: () => void;
  duration?: number;
};

const toneClasses = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-success-100 bg-success-50 text-success-700",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

export function ToastMessage({
  tone = "error",
  children,
  onClose,
  duration = 5000,
}: ToastMessageProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [children, onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-20 z-[1200] flex justify-center px-4 sm:px-6"
    >
      <div
        className={`flex max-w-[min(420px,calc(100vw-2rem))] items-start justify-between gap-4 rounded-lg border p-4 text-sm font-semibold leading-6 shadow-soft ${toneClasses[tone]}`}
      >
        <p className="min-w-0 flex-1 whitespace-pre-line">{children}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-bold transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-label="Fermer le message"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
