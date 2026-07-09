"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createPharmacyJoinRequest,
  type PharmacySummary,
} from "@/lib/api";

type RequestedRole = "MANAGER" | "PHARMACIST" | "EMPLOYEE";

type JoinRequestModalProps = {
  pharmacy: PharmacySummary | null;
  onClose: () => void;
};

export function JoinRequestModal({ pharmacy, onClose }: JoinRequestModalProps) {
  const [requestedRole, setRequestedRole] = useState<RequestedRole>("EMPLOYEE");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pharmacy) {
      return;
    }

    setRequestedRole("EMPLOYEE");
    setMessage("");
    setState("idle");
    setError(null);
  }, [pharmacy]);

  useEffect(() => {
    if (!pharmacy) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && state !== "sending") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [pharmacy, state, onClose]);

  if (!pharmacy) {
    return null;
  }

  async function submitJoinRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pharmacy) {
      return;
    }

    setState("sending");
    setError(null);

    try {
      await createPharmacyJoinRequest({
        pharmacy: pharmacy.databaseId || pharmacy.id,
        requestedRole,
        message: message.trim(),
      });
      setState("success");
    } catch (currentError) {
      setState("idle");
      setError(
        currentError instanceof Error
          ? currentError.message
          : "Impossible d'envoyer cette demande d'adhésion.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={() => state !== "sending" && onClose()}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-request-title"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-app-border bg-app-card p-6 shadow-soft"
      >
        {state === "success" ? (
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-xl font-bold text-success-700 ring-1 ring-success-100">
              ✓
            </span>
            <h2
              id="join-request-title"
              className="mt-4 text-2xl font-bold text-app-text"
            >
              Demande envoyée
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              Votre demande d'intégration a été envoyée à {pharmacy.name}. La
              pharmacie pourra l'examiner depuis son espace Kisinet.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 sm:w-auto"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submitJoinRequest}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-success-700">
                  Demande d'intégration
                </p>
                <h2
                  id="join-request-title"
                  className="mt-2 text-2xl font-bold text-app-text"
                >
                  Devenir employé
                </h2>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  Envoyez une demande d'adhésion à {pharmacy.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={state === "sending"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-app-border bg-app-surface text-xl font-semibold text-app-muted transition hover:bg-primary-50 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-app-border bg-app-background p-4">
              <p className="font-semibold text-app-text">{pharmacy.name}</p>
              <p className="mt-1 text-sm leading-6 text-app-muted">
                {pharmacy.addressLine || "Adresse non renseignée"}
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-app-text">
                Rôle demandé
                <select
                  value={requestedRole}
                  onChange={(event) =>
                    setRequestedRole(event.target.value as RequestedRole)
                  }
                  disabled={state === "sending"}
                  className="min-h-11 rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="EMPLOYEE">Employé</option>
                  <option value="PHARMACIST">Pharmacien</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-app-text">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
                  disabled={state === "sending"}
                  rows={5}
                  placeholder="Présentez brièvement votre demande..."
                  className="resize-none rounded-md border border-app-border bg-app-background px-3 py-3 text-sm font-medium text-app-text outline-none transition placeholder:text-app-muted focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="text-xs font-medium text-app-muted">
                  {message.length}/1000 caractères
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={state === "sending"}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={state === "sending"}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-success-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-success-700 focus:outline-none focus:ring-4 focus:ring-success-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "sending" ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
