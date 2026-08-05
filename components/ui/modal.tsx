"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  // Empêche la fermeture accidentelle (Échap, clic overlay, bouton) pendant une
  // sauvegarde ou un chargement. Le bouton et l'overlay restent visibles mais
  // inactifs tant que `saving` est vrai.
  saving?: boolean;
};

// Fenêtre modale générique utilisée par les formulaires d'administration.
// La fermeture est possible via le bouton, l'overlay ou la touche Échap, sauf
// lorsque `saving` est vrai (protection anti-fermeture accidentelle).
// Aucune logique métier n'est incluse : elle se contente d'afficher `children`.
export function Modal({ open, title, onClose, children, saving = false }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      // On bloque la touche Échap pendant la sauvegarde.
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4">
      <div
        aria-hidden="true"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-app-text">{title}</h3>
          <button
            type="button"
            onClick={() => {
              if (!saving) {
                onClose();
              }
            }}
            disabled={saving}
            aria-label="Fermer"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-muted transition hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
