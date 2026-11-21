"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { Modal } from "@/components/ui/modal";
import {
  getAdminReferralWithdrawalSummary,
  getAdminReferralWithdrawals,
  transitionAdminReferralWithdrawal,
  type AdminReferralWithdrawal,
  type AdminReferralWithdrawalSummary,
} from "@/lib/api/admin";
import { formatAmount, formatPercent } from "@/lib/referrals/withdrawal-format";

type PageState = "loading" | "ready" | "error";
type WithdrawalAction = "processing" | "paid" | "reject";

const statusLabels: Record<string, string> = {
  REQUESTED: "En attente", PROCESSING: "En traitement", PAID: "Payé", REJECTED: "Rejeté",
  FAILED: "Échoué", CANCELLED: "Annulé",
};
const inputClassName = "w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100";

export default function AdminPaymentsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [withdrawals, setWithdrawals] = useState<AdminReferralWithdrawal[]>([]);
  const [summary, setSummary] = useState<AdminReferralWithdrawalSummary | null>(null);
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
  const [detailWithdrawal, setDetailWithdrawal] = useState<AdminReferralWithdrawal | null>(null);
  const [paidWithdrawal, setPaidWithdrawal] = useState<AdminReferralWithdrawal | null>(null);
  const [rejectedWithdrawal, setRejectedWithdrawal] = useState<AdminReferralWithdrawal | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferMethod, setTransferMethod] = useState("");
  const [administrativeNote, setAdministrativeNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { setPage(1); setDebouncedSearch(search.trim()); }, 450);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;
    async function loadWithdrawals() {
      setState("loading");
      setMessage("");
      try {
        const [data, nextSummary] = await Promise.all([
          getAdminReferralWithdrawals({ search: debouncedSearch, status: statusFilter, currency: currencyFilter, page }),
          getAdminReferralWithdrawalSummary(),
        ]);
        if (!isCurrent) return;
        setWithdrawals(data.results);
        setSummary(nextSummary);
        setCount(data.count);
        setHasNextPage(Boolean(data.next));
        setHasPreviousPage(Boolean(data.previous));
        setState("ready");
      } catch (error) {
        if (!isCurrent) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Impossible de charger les retraits.");
      }
    }
    void loadWithdrawals();
    return () => { isCurrent = false; };
  }, [currencyFilter, debouncedSearch, page, refreshIndex, statusFilter]);

  async function runTransition(
    withdrawal: AdminReferralWithdrawal,
    action: WithdrawalAction,
    payload: { provider_reference?: string; reason?: string; provider_metadata?: Record<string, string> } = {},
  ) {
    setProcessingReference(withdrawal.reference);
    setMessage("");
    setActionError("");
    try {
      const updatedWithdrawal = await transitionAdminReferralWithdrawal(
        withdrawal.reference,
        action,
        payload,
      );
      setWithdrawals((current) =>
        current.map((item) =>
          item.reference === updatedWithdrawal.reference ? updatedWithdrawal : item,
        ),
      );
      setRefreshIndex((current) => current + 1);
      setMessage(action === "processing" ? "La demande est maintenant en traitement." : action === "paid" ? "Le retrait a été confirmé comme payé." : "La demande a été rejetée et le montant sera restitué par le backend.");
      setPaidWithdrawal(null);
      setRejectedWithdrawal(null);
      setDetailWithdrawal(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Action impossible.";
      if (action === "paid" || action === "reject") setActionError(errorMessage);
      else setMessage(errorMessage);
    } finally {
      setProcessingReference("");
    }
  }

  function openPaidDialog(withdrawal: AdminReferralWithdrawal) {
    setPaidWithdrawal(withdrawal);
    setPaymentReference("");
    setTransferDate("");
    setTransferMethod(withdrawal.payment_method || "");
    setAdministrativeNote("");
    setActionError("");
  }

  function openRejectDialog(withdrawal: AdminReferralWithdrawal) {
    setRejectedWithdrawal(withdrawal);
    setRejectionReason("");
    setActionError("");
  }

  function submitPaid(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paidWithdrawal || !paymentReference.trim() || !transferDate || !transferMethod.trim()) {
      setActionError("La référence, la date et le moyen de paiement sont obligatoires.");
      return;
    }
    void runTransition(paidWithdrawal, "paid", {
      provider_reference: paymentReference.trim(),
      provider_metadata: { transfer_date: transferDate, payment_method: transferMethod.trim(), administrative_note: administrativeNote.trim() },
    });
  }

  function submitRejection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectedWithdrawal || !rejectionReason.trim()) {
      setActionError("Le motif de rejet est obligatoire.");
      return;
    }
    void runTransition(rejectedWithdrawal, "reject", { reason: rejectionReason.trim() });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Admin-Referral</p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Demandes de retrait</h2>
            <p className="mt-2 text-sm text-app-muted">Gestion manuelle des commissions de parrainage, sans transfert automatique.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Référence ou utilisateur" aria-label="Rechercher une demande de retrait" className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
            <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }} aria-label="Filtrer par statut" className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100">
              <option value="">Tous statuts</option><option value="REQUESTED">En attente</option><option value="PROCESSING">En traitement</option><option value="PAID">Payé</option><option value="REJECTED">Rejeté</option>
            </select>
            <select value={currencyFilter} onChange={(event) => { setPage(1); setCurrencyFilter(event.target.value); }} aria-label="Filtrer par devise" className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100">
              <option value="">Toutes devises</option><option value="USD">USD</option><option value="CDF">CDF</option>
            </select>
          </div>
        </div>
      </div>

      <WithdrawalIndicators summary={summary} />
      {message && <p className="rounded-lg border border-app-border bg-app-card px-4 py-3 text-sm text-app-muted shadow-sm">{message}</p>}
      {state === "loading" && <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm"><LoadingBubble label="Chargement des retraits" className="min-h-[260px]" /></section>}
      {state === "error" && <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm"><p className="text-sm font-semibold text-red-700">Chargement impossible</p><p className="mt-2 text-sm text-app-muted">{message}</p><Button onClick={() => setRefreshIndex((current) => current + 1)} className="mt-5">Réessayer</Button></section>}

      {state === "ready" && (
        <section className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-3"><p className="text-sm text-app-muted">{count} demande{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}.</p><Button type="button" variant="secondary" onClick={() => setRefreshIndex((current) => current + 1)}>Actualiser</Button></div>
          <div className="overflow-x-auto">
            <table className="min-w-[1540px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted"><tr><th className="px-3 py-3">Référence</th><th className="px-3 py-3">Utilisateur</th><th className="px-3 py-3">Montant débité</th><th className="px-3 py-3">Frais</th><th className="px-3 py-3">Montant net</th><th className="px-3 py-3">Devise</th><th className="px-3 py-3">Opérateur</th><th className="px-3 py-3">Numéro</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-app-border">
                {withdrawals.map((withdrawal) => {
                  const destination = getDestination(withdrawal.destination_snapshot);
                  const busy = processingReference === withdrawal.reference;
                  return <tr key={withdrawal.reference} className="align-top">
                    <td className="px-3 py-3 font-mono font-semibold text-app-text">{withdrawal.reference}</td>
                    <td className="max-w-[220px] px-3 py-3"><p className="truncate font-semibold text-app-text">{withdrawal.requester_email}</p><p className="font-mono text-[11px] text-app-muted">{withdrawal.requester_reference}</p></td>
                    <td className="px-3 py-3 font-semibold text-app-text">{formatAmount(withdrawal.total_reserved_amount, withdrawal.currency)}</td>
                    <td className="px-3 py-3 text-app-muted">{formatAmount(withdrawal.fee_amount, withdrawal.currency)}</td>
                    <td className="px-3 py-3 font-semibold text-app-text">{formatAmount(netPayoutAmount(withdrawal), withdrawal.currency)}</td>
                    <td className="px-3 py-3 text-app-muted">{withdrawal.currency}</td><td className="px-3 py-3 text-app-muted">{destination.operator || "-"}</td><td className="px-3 py-3 font-mono text-app-muted">{destination.phoneNumber || "-"}</td><td className="px-3 py-3 text-app-muted">{formatDate(withdrawal.requested_at)}</td><td className="px-3 py-3"><StatusBadge status={withdrawal.status} /></td>
                    <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><ActionButton label="Voir" onClick={() => setDetailWithdrawal(withdrawal)} /><ActionButton label={busy ? "Traitement..." : "Prendre en charge"} disabled={withdrawal.status !== "REQUESTED" || busy} onClick={() => void runTransition(withdrawal, "processing")} /><ActionButton label="Marquer comme payé" disabled={withdrawal.status !== "PROCESSING" || busy} onClick={() => openPaidDialog(withdrawal)} /><ActionButton label="Rejeter" disabled={!['REQUESTED', 'PROCESSING'].includes(withdrawal.status) || busy} onClick={() => openRejectDialog(withdrawal)} /></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {!withdrawals.length && <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">Aucune demande de retrait trouvée.</p>}
          <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-app-muted">Page {page} · 20 lignes maximum par page · {count} résultat{count > 1 ? "s" : ""}</p><div className="flex gap-2"><Button type="button" variant="secondary" disabled={!hasPreviousPage} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}>Précédent</Button><Button type="button" variant="secondary" disabled={!hasNextPage} onClick={() => setPage((currentPage) => currentPage + 1)}>Suivant</Button></div></div>
        </section>
      )}

      <Modal open={Boolean(detailWithdrawal)} title="Détails du retrait" onClose={() => setDetailWithdrawal(null)}>{detailWithdrawal && <WithdrawalDetails withdrawal={detailWithdrawal} />}</Modal>
      <Modal open={Boolean(paidWithdrawal)} title="Confirmer le retrait payé" onClose={() => setPaidWithdrawal(null)} saving={Boolean(paidWithdrawal && processingReference === paidWithdrawal.reference)}>
        {paidWithdrawal && <form className="space-y-4" onSubmit={submitPaid}>
          <p className="rounded-md border border-app-border bg-app-surface p-3 text-sm text-app-muted">Montant net à transférer : <span className="font-semibold text-app-text">{formatAmount(netPayoutAmount(paidWithdrawal), paidWithdrawal.currency)}</span><br />Destinataire : <span className="font-mono text-app-text">{getDestination(paidWithdrawal.destination_snapshot).phoneNumber || "Non disponible"}</span></p>
          <p className="text-sm leading-6 text-app-muted">Confirmez-vous que le montant a réellement été transféré au bénéficiaire ? Cette action enregistrera le retrait comme payé.</p>
          <FormField label="Référence de transaction Mobile Money"><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} required className={inputClassName} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="Date du transfert"><input type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} required className={inputClassName} /></FormField><FormField label="Moyen de paiement utilisé"><input value={transferMethod} onChange={(event) => setTransferMethod(event.target.value)} required className={inputClassName} /></FormField></div>
          <FormField label="Note administrative (facultative)"><textarea value={administrativeNote} onChange={(event) => setAdministrativeNote(event.target.value)} rows={3} className={inputClassName} /></FormField>
          {actionError && <p className="text-sm text-red-700">{actionError}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setPaidWithdrawal(null)} disabled={Boolean(processingReference)}>Annuler</Button><Button type="submit" disabled={processingReference === paidWithdrawal.reference}>{processingReference === paidWithdrawal.reference ? "Confirmation..." : "Confirmer le paiement"}</Button></div>
        </form>}
      </Modal>
      <Modal open={Boolean(rejectedWithdrawal)} title="Rejeter la demande" onClose={() => setRejectedWithdrawal(null)} saving={Boolean(rejectedWithdrawal && processingReference === rejectedWithdrawal.reference)}>
        {rejectedWithdrawal && <form className="space-y-4" onSubmit={submitRejection}>
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">Le rejet libérera le montant réservé et le rendra à nouveau disponible dans le portefeuille de commissions de l&apos;utilisateur.</p>
          <FormField label="Motif du rejet"><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} required className={inputClassName} /></FormField>
          {actionError && <p className="text-sm text-red-700">{actionError}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setRejectedWithdrawal(null)} disabled={Boolean(processingReference)}>Annuler</Button><Button type="submit" disabled={processingReference === rejectedWithdrawal.reference}>{processingReference === rejectedWithdrawal.reference ? "Rejet..." : "Rejeter la demande"}</Button></div>
        </form>}
      </Modal>
    </section>
  );
}

function WithdrawalIndicators({ summary }: { summary: AdminReferralWithdrawalSummary | null }) {
  return <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Indicator label="En attente" value={summary ? String(summary.requested_count) : "—"} /><Indicator label="En traitement" value={summary ? String(summary.processing_count) : "—"} /><Indicator label="Rejetées" value={summary ? String(summary.rejected_count) : "—"} /><TotalsIndicator label="Total en attente" totals={summary?.pending_totals || []} /><TotalsIndicator label="Total payé" totals={summary?.paid_totals || []} /></section>;
}
function Indicator({ label, value }: { label: string; value: string }) { return <article className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p><p className="mt-2 text-2xl font-bold text-app-text">{value}</p></article>; }
function TotalsIndicator({ label, totals }: { label: string; totals: { currency: string; amount: string }[] }) { return <article className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p><p className="mt-2 min-h-8 text-sm font-bold text-app-text">{totals.length ? totals.map((total) => formatAmount(total.amount, total.currency)).join(" · ") : "—"}</p></article>; }

function WithdrawalDetails({ withdrawal }: { withdrawal: AdminReferralWithdrawal }) {
  const destination = getDestination(withdrawal.destination_snapshot);
  return <div className="space-y-5 text-sm"><DetailGroup title="Informations utilisateur"><DetailRow label="Utilisateur" value={withdrawal.requester_email} /><DetailRow label="Identifiant" value={withdrawal.requester_reference} mono /><DetailRow label="Référence du retrait" value={withdrawal.reference} mono /></DetailGroup><DetailGroup title="Informations financières"><DetailRow label="Montant débité" value={formatAmount(withdrawal.total_reserved_amount, withdrawal.currency)} /><DetailRow label="Taux de frais" value={formatPercent(withdrawal.fee_rate)} /><DetailRow label="Montant des frais" value={formatAmount(withdrawal.fee_amount, withdrawal.currency)} /><DetailRow label="Montant net" value={formatAmount(netPayoutAmount(withdrawal), withdrawal.currency)} /><DetailRow label="Devise" value={withdrawal.currency} /></DetailGroup><DetailGroup title="Destination"><DetailRow label="Pays" value={destination.country || "Non renseigné"} /><DetailRow label="Opérateur" value={destination.operator || "Non renseigné"} /><DetailRow label="Numéro Mobile Money" value={destination.phoneNumber || "Non renseigné"} mono /><DetailRow label="Bénéficiaire" value={destination.accountName || "Non renseigné"} /></DetailGroup><DetailGroup title="Suivi"><DetailRow label="Statut" value={statusLabels[withdrawal.status] || withdrawal.status} /><DetailRow label="Date de création" value={formatDate(withdrawal.requested_at)} /><DetailRow label="Début du traitement" value={formatDate(withdrawal.processing_at)} /><DetailRow label="Date du transfert" value={withdrawal.transfer_date || formatDate(withdrawal.paid_at)} /><DetailRow label="Administrateur responsable" value={withdrawal.processed_by_email || withdrawal.processed_by_reference || "Non renseigné"} /><DetailRow label="Référence du transfert" value={withdrawal.provider_reference || "Non renseignée"} mono />{withdrawal.transfer_payment_method && <DetailRow label="Moyen utilisé" value={withdrawal.transfer_payment_method} />}{withdrawal.administrative_note && <DetailRow label="Note administrative" value={withdrawal.administrative_note} />}{withdrawal.rejection_reason && <DetailRow label="Motif du rejet" value={withdrawal.rejection_reason} />}</DetailGroup></div>;
}
function DetailGroup({ children, title }: { children: React.ReactNode; title: string }) { return <section><h4 className="font-semibold text-app-text">{title}</h4><dl className="mt-2 space-y-2 rounded-md border border-app-border bg-app-surface p-3">{children}</dl></section>; }
function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="grid gap-1 sm:grid-cols-[180px_1fr]"><dt className="text-app-muted">{label}</dt><dd className={`break-words text-app-text ${mono ? "font-mono" : ""}`}>{value}</dd></div>; }
function FormField({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block text-sm font-medium text-app-text">{label}<span className="mt-1 block">{children}</span></label>; }
function ActionButton({ disabled = false, label, onClick }: { disabled?: boolean; label: string; onClick: () => void }) { return <button type="button" disabled={disabled} onClick={onClick} className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-semibold text-app-text transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40">{label}</button>; }
function StatusBadge({ status }: { status: string }) { const tone = status === "PAID" ? "success" : status === "REJECTED" || status === "FAILED" ? "danger" : "default"; return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${tone === "success" ? "bg-success-50 text-success-700" : tone === "danger" ? "bg-red-50 text-red-700" : "bg-primary-50 text-primary-700"}`}>{statusLabels[status] || status}</span>; }
function getDestination(destination: Record<string, unknown>) { const metadata = record(destination.metadata); return { country: text(destination.country) || text(metadata.country), operator: text(destination.operator) || text(destination.provider), phoneNumber: text(destination.phone_number) || text(destination.destination), accountName: text(destination.account_name) }; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function text(value: unknown): string { return value === undefined || value === null ? "" : String(value); }
function netPayoutAmount(withdrawal: AdminReferralWithdrawal): string { return withdrawal.net_payout_amount || withdrawal.amount; }
function formatDate(value: string | null): string { if (!value) return "Non renseignée"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date); }
