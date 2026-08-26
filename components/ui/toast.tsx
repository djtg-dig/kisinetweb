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
  // Position à l'écran. "top-right" (défaut) en haut à droite ; "center"
  // superpose le toast au centre de l'écran (utile pour confirmer une action
  // ponctuelle sans ancrage latéral).
  position?: "top-right" | "center";
};

// Notification temporaire (toast) qui se ferme automatiquement après `duration`
// millisecondes (5 s par défaut) : l'utilisateur n'a jamais besoin de cliquer
// pour la faire disparaître. `tone` détermine la couleur (succès / erreur /
// avertissement) et `position` son emplacement à l'écran.
export function ToastMessage({
  tone,
  children,
  onClose,
  duration = 5000,
  position = "top-right",
}: ToastMessageProps) {
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

  // Positionnement : ancrage haut-droite par défaut, ou centrage vertical et
  // horizontal au milieu de l'écran.
  const positionClass =
    position === "center"
      ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      : "right-4 top-20 lg:top-24";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`fixed z-[1200] flex w-[min(calc(100vw-2rem),28rem)] items-start justify-between gap-4 rounded-lg border p-4 shadow-soft ${positionClass} ${toneClass}`}
    >
      <p className="text-sm font-semibold">{children}</p>
      <button type="button" onClick={onClose} aria-label="Fermer" className="text-sm font-bold">
        Fermer
      </button>
    </div>
  );
}
