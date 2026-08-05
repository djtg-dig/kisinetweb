"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type ToastMessageProps = {
  tone: "success" | "error" | "warning";
  children: ReactNode;
  onClose: () => void;
  // Durée d'affichage automatique en millisecondes. La valeur par défaut (5000)
  // fait disparaître le toast sans aucun clic. Une valeur <= 0 le laisse
  // affiché jusqu'à l'action de l'utilisateur.
  duration?: number;
};

// Notification temporaire (toast) affichée en haut à droite de l'écran.
// Elle se ferme automatiquement après `duration` millisecondes (5 s par défaut)
// : l'utilisateur n'a jamais besoin de cliquer pour la faire disparaître.
// `tone` détermine la couleur (succès / erreur / avertissement).
export function ToastMessage({ tone, children, onClose, duration = 5000 }: ToastMessageProps) {
  useEffect(() => {
    if (duration <= 0) {
      return;
    }

    const timer = window.setTimeout(onClose, duration);

    return () => window.clearTimeout(timer);
  }, [children, onClose, duration]);

  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`fixed right-4 top-20 z-[1200] flex w-[min(calc(100vw-2rem),28rem)] items-start justify-between gap-4 rounded-lg border p-4 shadow-soft lg:top-24 ${toneClass}`}
    >
      <p className="text-sm font-semibold">{children}</p>
      <button type="button" onClick={onClose} aria-label="Fermer" className="text-sm font-bold">
        Fermer
      </button>
    </div>
  );
}
