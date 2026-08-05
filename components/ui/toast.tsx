"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type ToastMessageProps = {
  tone: "success" | "error";
  children: ReactNode;
  onClose: () => void;
};

// Notification temporaire (toast) affichée en haut à droite de l'écran.
// Elle se ferme automatiquement après 5 secondes, comme sur les autres
// pages de l'application. `tone` détermine la couleur (succès / erreur).
export function ToastMessage({ tone, children, onClose }: ToastMessageProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);

    return () => window.clearTimeout(timer);
  }, [children, onClose]);

  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      role="status"
      className={`fixed right-4 top-20 z-[1200] flex w-[min(calc(100vw-2rem),28rem)] items-start justify-between gap-4 rounded-lg border p-4 shadow-soft lg:top-24 ${toneClass}`}
    >
      <p className="text-sm font-semibold">{children}</p>
      <button type="button" onClick={onClose} aria-label="Fermer" className="text-sm font-bold">
        Fermer
      </button>
    </div>
  );
}
