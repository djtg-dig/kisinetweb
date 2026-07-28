"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAdminReferralWithdrawals,
  transitionAdminReferralWithdrawal,
  type AdminReferralWithdrawal,
} from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

export default function AdminPaymentsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [withdrawals, setWithdrawals] = useState<AdminReferralWithdrawal[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [processingReference, setProcessingReference] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;

    async function loadWithdrawals() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminReferralWithdrawals({
          search: debouncedSearch,
          status: statusFilter,
          currency: currencyFilter,
          page,
        });
        if (!isCurrent) {
          return;
        }
        setWithdrawals(data.results);
        setCount(data.count);
        setHasNextPage(Boolean(data.next));
        setHasPreviousPage(Boolean(data.previous));
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Impossible de charger les retraits.",
        );
      }
    }

    void loadWithdrawals();

    return () => {
      isCurrent = false;
    };
  }, [currencyFilter, debouncedSearch, page, refreshIndex, statusFilter]);

  async function runTransition(
    withdrawal: AdminReferralWithdrawal,
    action: "processing" | "paid" | "reject" | "failed",
  ) {
    setProcessingReference(withdrawal.reference);
    setMessage("");

    const providerReference =
      action === "paid" ? window.prompt("Référence du paiement manuel", "") || "" : "";
    const reason =
      action === "reject" || action === "failed"
        ? window.prompt("Raison", "") || ""
        : "";

    try {
      await transitionAdminReferralWithdrawal(withdrawal.reference, action, {
        provider_reference: providerReference,
        reason,
      });
      setRefreshIndex((current) => current + 1);
      setMessage("Demande de retrait mise à jour.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setProcessingReference("");
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Admin-Referral</p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Retraits de commissions</h2>
            <p className="mt-2 text-sm text-app-muted">
              {count} demande{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Référence, email, prestataire"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            >
              <option value="">Tous statuts</option>
              <option value="REQUESTED">Demandé</option>
              <option value="PROCESSING">En traitement</option>
              <option value="PAID">Payé</option>
              <option value="REJECTED">Rejeté</option>
              <option value="FAILED">Échoué</option>
            </select>
            <input
              value={currencyFilter}
              onChange={(event) => {
                setPage(1);
                setCurrencyFilter(event.target.value.toUpperCase());
              }}
              placeholder="Devise"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm uppercase outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-app-border bg-app-card px-4 py-3 text-sm text-app-muted shadow-sm">
          {message}
        </p>
      )}

      {state === "loading" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des retraits" className="min-h-[260px]" />
        </section>
      )}

      {state === "error" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Chargement impossible</p>
          <p className="mt-2 text-sm text-app-muted">{message}</p>
          <Button onClick={() => setRefreshIndex((current) => current + 1)} className="mt-5">
            Réessayer
          </Button>
        </section>
      )}

      {state === "ready" && (
        <section className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  <th className="px-3 py-3">Référence</th>
                  <th className="px-3 py-3">Utilisateur</th>
                  <th className="px-3 py-3">Montant</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Compte</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3">Prestataire</th>
                  <th className="px-3 py-3">Demandé le</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.reference} className="align-top">
                    <td className="px-3 py-3 font-mono font-semibold text-app-text">
                      {withdrawal.reference}
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <p className="truncate font-semibold text-app-text">
                        {withdrawal.requester_email}
                      </p>
                      <p className="font-mono text-[11px] text-app-muted">
                        {withdrawal.requester_reference}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-bold text-app-text">
                      {withdrawal.amount} {withdrawal.currency}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={withdrawal.status} />
                    </td>
                    <td className="px-3 py-3 font-mono text-app-muted">
                      {withdrawal.payout_account_reference || "-"}
                    </td>
                    <td className="max-w-[260px] px-3 py-3 text-app-muted">
                      {formatDestination(withdrawal.destination_snapshot)}
                    </td>
                    <td className="px-3 py-3 text-app-muted">
                      {withdrawal.provider_reference || "-"}
                    </td>
                    <td className="px-3 py-3 text-app-muted">{withdrawal.requested_at}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          label="Traitement"
                          disabled={
                            withdrawal.status !== "REQUESTED" ||
                            processingReference === withdrawal.reference
                          }
                          onClick={() => void runTransition(withdrawal, "processing")}
                        />
                        <ActionButton
                          label="Payé"
                          disabled={
                            !["REQUESTED", "PROCESSING"].includes(withdrawal.status) ||
                            processingReference === withdrawal.reference
                          }
                          onClick={() => void runTransition(withdrawal, "paid")}
                        />
                        <ActionButton
                          label="Rejeter"
                          disabled={
                            !["REQUESTED", "PROCESSING"].includes(withdrawal.status) ||
                            processingReference === withdrawal.reference
                          }
                          onClick={() => void runTransition(withdrawal, "reject")}
                        />
                        <ActionButton
                          label="Échec"
                          disabled={
                            withdrawal.status !== "PROCESSING" ||
                            processingReference === withdrawal.reference
                          }
                          onClick={() => void runTransition(withdrawal, "failed")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!withdrawals.length && (
            <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
              Aucune demande de retrait trouvée.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-app-muted">
              Page {page} · 20 lignes maximum par page · {count} résultat{count > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!hasPreviousPage}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!hasNextPage}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

function ActionButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-semibold text-app-text transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "PAID" ? "success" : status === "REJECTED" || status === "FAILED" ? "danger" : "default";
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
        tone === "success"
          ? "bg-success-50 text-success-700"
          : tone === "danger"
            ? "bg-red-50 text-red-700"
            : "bg-primary-50 text-primary-700"
      }`}
    >
      {status}
    </span>
  );
}

function formatDestination(destination: Record<string, unknown>) {
  const operator = text(destination.operator) || text(destination.provider);
  const phone = text(destination.phone_number);
  const accountName = text(destination.account_name);
  return [operator, phone, accountName].filter(Boolean).join(" · ") || "-";
}

function text(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}
