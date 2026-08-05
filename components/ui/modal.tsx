"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// Fenêtre modale générique utilisée par les formulaires d'administration.
// La fermeture est possible via le bouton, l'overlay ou la touche Échap.
// Aucune logique métier n'est incluse : elle se contente d'afficher `children`.
export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-app-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-muted transition hover:text-app-text"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
