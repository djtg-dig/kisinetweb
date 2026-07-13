"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  getPharmacyDetail,
  getPharmacyPermissions,
  type PharmacyPermissions,
} from "@/lib/api";
import {
  getInvoiceMetadata,
  getPharmacyInvoices,
  type Invoice,
  type InvoiceFilters,
  type InvoiceStatusOption,
  type InvoicePaymentStatus,
  type InvoiceSummary,
} from "@/lib/api/invoices";

type InvoicesPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

// Union de chaînes : elle limite les états possibles de la page à ces valeurs précises.
type PageState = "loading" | "ready" | "empty" | "forbidden" | "error";

const defaultFilters: InvoiceFilters = {
  search: "",
  status: "",
  createdFrom: "",
  createdTo: "",
  page: "1",
};

const defaultStatusOptions: { value: string; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "UNPAID", label: "Non payée" },
  { value: "PARTIALLY_PAID", label: "Partiellement payée" },
  { value: "PAID", label: "Payée" },
  { value: "OVERPAID", label: "Payée avec excédent" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "CANCELED", label: "Annulée" },
  { value: "DRAFT", label: "Brouillon" },
];

export default function PharmacyInvoicesPage({ params }: InvoicesPageProps) {
  // `useState<Type>()` indique à TypeScript la forme exacte de la donnée stockée.
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [filters, setFilters] = useState<InvoiceFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<InvoiceFilters>(defaultFilters);
  const [statusOptions, setStatusOptions] = useState(defaultStatusOptions);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Dans l'App Router, `params` est reçu comme Promise dans ce composant client.
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }

    readParams();
  }, [params]);

  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    async function loadInvoicesPage() {
      setState("loading");
      setErrorMessage("");

      try {
        // On charge d'abord le contexte et les droits pour éviter d'appeler les factures sans accès vente.
        const [userPermissions, pharmacy] = await Promise.all([
          getPharmacyPermissions(pharmacyId),
          getPharmacyDetail(pharmacyId),
        ]);

        setPermissions(userPermissions);
        setPharmacyName(pharmacy.name || "");
        setCurrency(pharmacy.devise || "USD");

        if (!userPermissions.sale_view) {
          setState("forbidden");
          return;
        }

        const [page, metadata] = await Promise.all([
          getPharmacyInvoices(pharmacyId, filters),
          getInvoiceMetadata(pharmacyId).catch(() => null),
        ]);

        if (metadata) {
          setStatusOptions(buildStatusOptions(metadata.statuses, metadata.paymentStatuses));
        }

        setInvoices(page.results);
        setSummary(page.summary);
        setTotalInvoices(page.count);
        setHasNextPage(Boolean(page.next));
        setHasPreviousPage(Boolean(page.previous));
        setState(page.results.length ? "ready" : "empty");
      } catch {
        setErrorMessage(
          "Une erreur s'est produite lors du chargement des factures. Veuillez réessayer.",
        );
        setState("error");
      }
    }

    loadInvoicesPage();
  }, [pharmacyId, filters, reloadKey]);

  const currentPage = Number(filters.page || 1);
  const pageCount = Math.max(1, Math.ceil(totalInvoices / 10));
  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.createdFrom || filters.createdTo,
  );
  const activeSummary = summary || buildEmptySummary(totalInvoices);
  const cashRegisterUnavailable =
    "La permission d'encaissement est disponible, mais la route Caisse n'est pas encore connectée dans ce frontend.";

  function applyFilters(nextFilters: InvoiceFilters) {
    const cleanedFilters = cleanFilters({ ...nextFilters, page: "1" });
    setDraftFilters(cleanedFilters);
    setFilters(cleanedFilters);
  }

  function goToPage(page: number) {
    setFilters((current) => cleanFilters({ ...current, page: String(page) }));
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-background text-app-text lg:min-h-[calc(100vh-4.5rem)]">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">
              {pharmacyName || "Pharmacie active"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Factures</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Consultez, recherchez et suivez les factures de cette pharmacie.
            </p>
          </div>
          {permissions.sale_create && pharmacyId && (
            <LinkButton href={"/app/pharmacies/" + pharmacyId + "/sales/create"}>
              Nouvelle vente
            </LinkButton>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SummaryCards
          summary={activeSummary}
          currency={currency}
          loading={state === "loading"}
        />

        {activeSummary.source === "current_page" && state !== "loading" && (
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
            Les statistiques détaillées sont calculées sur les factures chargées dans la page courante.
            Un résumé global backend sera nécessaire pour des totaux par statut sur toute la pharmacie.
          </p>
        )}

        <InvoiceFiltersPanel
          filters={draftFilters}
          statusOptions={statusOptions}
          loading={state === "loading"}
          onChange={setDraftFilters}
          onApply={() => applyFilters(draftFilters)}
          onReset={() => applyFilters(defaultFilters)}
        />

        {/* Rendu conditionnel : chaque état affiche uniquement le bloc correspondant. */}
        {state === "loading" && <InvoicesSkeleton />}
        {state === "forbidden" && <ForbiddenState pharmacyId={pharmacyId} />}
        {state === "error" && (
          <ErrorState
            message={errorMessage}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}
        {state === "empty" && (
          <EmptyState
            pharmacyId={pharmacyId}
            canCreate={Boolean(permissions.sale_create)}
            hasActiveFilters={hasActiveFilters}
          />
        )}
        {state === "ready" && (
          <>
            <InvoicesList
              invoices={invoices}
              currency={currency}
              pharmacyId={pharmacyId}
              canCancel={Boolean(permissions.sale_cancel)}
              canOpenCashRegister={Boolean(permissions.sale_payment_create)}
              cashRegisterUnavailable={cashRegisterUnavailable}
              onSelect={setSelectedInvoice}
            />
            <PaginationControls
              currentPage={currentPage}
              pageCount={pageCount}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={goToPage}
            />
          </>
        )}
      </main>

      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          currency={currency}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

function SummaryCards({
  summary,
  currency,
  loading,
}: {
  summary: InvoiceSummary;
  currency: string;
  loading: boolean;
}) {
  const cards = [
    { label: "Total des factures", value: String(summary.totalInvoices) },
    { label: "Non payées", value: String(summary.unpaidInvoices), tone: "warning" },
    { label: "Partiellement payées", value: String(summary.partiallyPaidInvoices), tone: "info" },
    { label: "Payées", value: String(summary.paidInvoices), tone: "success" },
    { label: "Reste à encaisser", value: formatCurrency(summary.remainingAmount, currency), tone: "warning" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{card.label}</p>
          {loading ? (
            <div className="mt-4 h-7 w-24 animate-pulse rounded-md bg-app-surface" />
          ) : (
            <p className={getSummaryValueClass(card.tone)}>{card.value}</p>
          )}
        </article>
      ))}
    </section>
  );
}

function InvoiceFiltersPanel({
  filters,
  statusOptions,
  loading,
  onChange,
  onApply,
  onReset,
}: {
  filters: InvoiceFilters;
  statusOptions: { value: string; label: string }[];
  loading: boolean;
  onChange: (filters: InvoiceFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  function updateFilter(name: keyof InvoiceFilters, value: string) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
        <FilterInput
          label="Recherche"
          value={filters.search || ""}
          placeholder="Rechercher par référence, client ou téléphone"
          onChange={(value) => updateFilter("search", value)}
        />
        <FilterSelect
          label="Statut"
          value={filters.status || ""}
          options={statusOptions}
          onChange={(value) => updateFilter("status", value)}
        />
        <FilterInput
          label="Date de début"
          type="date"
          value={filters.createdFrom || ""}
          onChange={(value) => updateFilter("createdFrom", value)}
        />
        <FilterInput
          label="Date de fin"
          type="date"
          value={filters.createdTo || ""}
          onChange={(value) => updateFilter("createdTo", value)}
        />
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button type="button" onClick={onApply} disabled={loading}>
            Rechercher
          </Button>
          <Button type="button" variant="secondary" onClick={onReset} disabled={loading}>
            Réinitialiser
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-app-muted">
        Le filtre par créateur nécessite un paramètre backend dédié et n'est pas encore affiché.
      </p>
    </section>
  );
}

function InvoicesList({
  invoices,
  currency,
  pharmacyId,
  canCancel,
  canOpenCashRegister,
  cashRegisterUnavailable,
  onSelect,
}: {
  invoices: Invoice[];
  currency: string;
  pharmacyId: string;
  canCancel: boolean;
  canOpenCashRegister: boolean;
  cashRegisterUnavailable: string;
  onSelect: (invoice: Invoice) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card shadow-sm">
      <div className="border-b border-app-border px-5 py-4">
        <h2 className="text-lg font-bold text-app-text">Liste des factures</h2>
        <p className="mt-1 text-sm text-app-muted">
          La caisse reste séparée : cette page sert à consulter et suivre les factures.
        </p>
      </div>

      <DesktopInvoicesTable
        invoices={invoices}
        currency={currency}
        pharmacyId={pharmacyId}
        canCancel={canCancel}
        canOpenCashRegister={canOpenCashRegister}
        cashRegisterUnavailable={cashRegisterUnavailable}
        onSelect={onSelect}
      />
      <MobileInvoicesList
        invoices={invoices}
        currency={currency}
        canCancel={canCancel}
        canOpenCashRegister={canOpenCashRegister}
        cashRegisterUnavailable={cashRegisterUnavailable}
        onSelect={onSelect}
      />
    </section>
  );
}

function DesktopInvoicesTable({
  invoices,
  currency,
  canCancel,
  canOpenCashRegister,
  cashRegisterUnavailable,
  onSelect,
}: {
  invoices: Invoice[];
  currency: string;
  pharmacyId: string;
  canCancel: boolean;
  canOpenCashRegister: boolean;
  cashRegisterUnavailable: string;
  onSelect: (invoice: Invoice) => void;
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-app-border bg-app-surface text-xs font-semibold uppercase text-app-muted">
            <th className="px-5 py-3">Référence</th>
            <th className="px-5 py-3">Client</th>
            <th className="px-5 py-3">Téléphone</th>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3 text-right">Montant total</th>
            <th className="px-5 py-3 text-right">Montant payé</th>
            <th className="px-5 py-3 text-right">Reste à payer</th>
            <th className="px-5 py-3">Statut</th>
            <th className="px-5 py-3">Créée par</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            // `key` aide React à identifier chaque ligne quand la liste change.
            <tr key={invoice.id || invoice.reference} className="border-b border-app-border last:border-0">
              <td className="px-5 py-4 font-semibold text-app-text">{invoice.reference}</td>
              <td className="px-5 py-4 text-app-muted">{invoice.customerName}</td>
              <td className="px-5 py-4 text-app-muted">{invoice.customerPhone}</td>
              <td className="px-5 py-4 text-app-muted">{formatDateTime(invoice.createdAt)}</td>
              <td className="px-5 py-4 text-right font-semibold text-app-text">
                {formatCurrency(invoice.totalAmount, currency)}
              </td>
              <td className="px-5 py-4 text-right text-app-muted">
                {formatCurrency(invoice.paidAmount, currency)}
              </td>
              <td className="px-5 py-4 text-right font-bold text-app-text">
                {formatCurrency(invoice.remainingAmount, currency)}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={invoice.paymentStatus} />
              </td>
              <td className="px-5 py-4 text-app-muted">{invoice.createdBy}</td>
              <td className="px-5 py-4">
                <InvoiceActions
                  invoice={invoice}
                  canCancel={canCancel}
                  canOpenCashRegister={canOpenCashRegister}
                  cashRegisterUnavailable={cashRegisterUnavailable}
                  onSelect={onSelect}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileInvoicesList({
  invoices,
  currency,
  canCancel,
  canOpenCashRegister,
  cashRegisterUnavailable,
  onSelect,
}: {
  invoices: Invoice[];
  currency: string;
  canCancel: boolean;
  canOpenCashRegister: boolean;
  cashRegisterUnavailable: string;
  onSelect: (invoice: Invoice) => void;
}) {
  return (
    <div className="grid gap-4 p-4 lg:hidden">
      {invoices.map((invoice) => (
        <article key={invoice.id || invoice.reference} className="rounded-lg border border-app-border bg-app-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-bold text-app-text">{invoice.reference}</h3>
              <p className="mt-1 text-sm text-app-muted">{invoice.customerName}</p>
            </div>
            <StatusBadge status={invoice.paymentStatus} />
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Date" value={formatDateTime(invoice.createdAt)} />
            <Info label="Total" value={formatCurrency(invoice.totalAmount, currency)} />
            <Info label="Reste à payer" value={formatCurrency(invoice.remainingAmount, currency)} strong />
            <Info label="Créée par" value={invoice.createdBy} />
          </div>
          <div className="mt-4">
            <InvoiceActions
              invoice={invoice}
              canCancel={canCancel}
              canOpenCashRegister={canOpenCashRegister}
              cashRegisterUnavailable={cashRegisterUnavailable}
              onSelect={onSelect}
              compact
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function InvoiceActions({
  invoice,
  canCancel,
  canOpenCashRegister,
  cashRegisterUnavailable,
  compact = false,
  onSelect,
}: {
  invoice: Invoice;
  canCancel: boolean;
  canOpenCashRegister: boolean;
  cashRegisterUnavailable: string;
  compact?: boolean;
  onSelect: (invoice: Invoice) => void;
}) {
  const canCollectPayment =
    canOpenCashRegister &&
    invoice.remainingAmount > 0 &&
    invoice.paymentStatus !== "PAID" &&
    invoice.paymentStatus !== "OVERPAID" &&
    invoice.paymentStatus !== "CANCELED" &&
    invoice.paymentStatus !== "DRAFT";

  return (
    <div className={compact ? "flex flex-col gap-2 sm:flex-row" : "flex justify-end gap-2"}>
      <button
        type="button"
        onClick={() => onSelect(invoice)}
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border bg-app-card px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
      >
        Voir
      </button>
      {canCollectPayment && (
        <span
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2 text-sm font-semibold text-app-muted"
          title={cashRegisterUnavailable}
        >
          Caisse à venir
        </span>
      )}
      {canCancel && invoice.paymentStatus !== "PAID" && invoice.paymentStatus !== "CANCELED" && (
        <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2 text-sm font-semibold text-app-muted">
          Annulation à connecter
        </span>
      )}
    </div>
  );
}

function InvoiceDetailDialog({
  invoice,
  currency,
  onClose,
}: {
  invoice: Invoice;
  currency: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer le détail"
        onClick={onClose}
      />
      <section className="relative w-full max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary-700">{invoice.reference}</p>
            <h2 className="mt-2 text-xl font-bold text-app-text">Détail de la facture</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-sm font-semibold text-app-text hover:bg-primary-50"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Detail label="Client" value={invoice.customerName} />
          <Detail label="Téléphone" value={invoice.customerPhone} />
          <Detail label="Date" value={formatDateTime(invoice.createdAt)} />
          <Detail label="Créée par" value={invoice.createdBy} />
          <Detail label="Sous-total" value={formatCurrency(invoice.subtotalAmount, currency)} />
          <Detail label="Réduction" value={formatCurrency(invoice.discountAmount, currency)} />
          <Detail label="Total" value={formatCurrency(invoice.totalAmount, currency)} />
          <Detail label="Payé" value={formatCurrency(invoice.paidAmount, currency)} />
          <Detail label="Reste" value={formatCurrency(invoice.remainingAmount, currency)} />
          <Detail label="Statut" value={getStatusLabel(invoice.paymentStatus)} />
        </div>
      </section>
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-app-border bg-app-surface p-4 lg:grid-cols-5">
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({
  pharmacyId,
  canCreate,
  hasActiveFilters,
}: {
  pharmacyId: string;
  canCreate: boolean;
  hasActiveFilters: boolean;
}) {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">
        {hasActiveFilters ? "Aucun résultat" : "Aucune facture"}
      </p>
      <h2 className="mt-2 text-xl font-bold text-app-text">
        {hasActiveFilters ? "Aucune facture ne correspond à votre recherche." : "Aucune facture enregistrée"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        {hasActiveFilters
          ? "Modifiez la recherche ou les filtres pour élargir les résultats."
          : "Les factures créées dans cette pharmacie apparaîtront ici."}
      </p>
      {canCreate && (
        <LinkButton href={"/app/pharmacies/" + pharmacyId + "/sales/create"} className="mt-5">
          Créer une vente
        </LinkButton>
      )}
    </section>
  );
}

function ForbiddenState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Accès limité</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Factures indisponibles</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Vous n'avez pas la permission de consulter les ventes et les factures de cette pharmacie.
      </p>
      <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary" className="mt-5">
        Retour au dashboard
      </LinkButton>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Impossible de charger les factures</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Factures indisponibles</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <Button type="button" variant="secondary" onClick={onRetry} className="mt-5">
        Réessayer
      </Button>
    </section>
  );
}

function PaginationControls({
  currentPage,
  pageCount,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-app-border bg-app-card p-4 text-sm sm:flex-row">
      <p className="font-semibold text-app-muted">
        Page {currentPage} sur {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoicePaymentStatus }) {
  return <span className={getStatusClass(status)}>{getStatusLabel(status)}</span>;
}

function FilterInput({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:bg-app-surface"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:bg-app-surface"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className={strong ? "mt-1 font-bold text-app-text" : "mt-1 font-medium text-app-text"}>{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-4">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 font-semibold text-app-text">{value}</p>
    </div>
  );
}

function buildEmptySummary(totalInvoices: number): InvoiceSummary {
  return {
    totalInvoices,
    unpaidInvoices: 0,
    partiallyPaidInvoices: 0,
    paidInvoices: 0,
    remainingAmount: 0,
    source: "current_page",
  };
}

function buildStatusOptions(
  statuses: InvoiceStatusOption[],
  paymentStatuses: InvoiceStatusOption[],
) {
  const options = [
    { value: "", label: "Tous les statuts" },
    ...paymentStatuses,
    ...statuses,
  ];
  const seen = new Set<string>();

  // Les métadonnées backend peuvent contenir des libellés différents, mais on
  // garde une option unique par valeur pour éviter les doublons dans le select.
  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });
}

function cleanFilters(filters: InvoiceFilters): InvoiceFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value && String(value).trim()),
  ) as InvoiceFilters;
}

function getSummaryValueClass(tone?: string) {
  const base = "mt-3 text-2xl font-bold";
  if (tone === "success") {
    return base + " text-success-700";
  }
  if (tone === "warning") {
    return base + " text-orange-700";
  }
  if (tone === "info") {
    return base + " text-cyan-700";
  }

  return base + " text-app-text";
}

function getStatusClass(status: InvoicePaymentStatus) {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (status === "PAID" || status === "OVERPAID") {
    return base + " bg-success-50 text-success-700 ring-success-100";
  }
  if (status === "PARTIALLY_PAID") {
    return base + " bg-cyan-50 text-cyan-700 ring-cyan-100";
  }
  if (status === "CANCELED") {
    return base + " bg-red-50 text-red-700 ring-red-100";
  }
  if (status === "DRAFT") {
    return base + " bg-app-surface text-app-muted ring-app-border";
  }

  return base + " bg-orange-50 text-orange-700 ring-orange-100";
}

function getStatusLabel(status: InvoicePaymentStatus) {
  const labels: Record<InvoicePaymentStatus, string> = {
    UNPAID: "Non payée",
    PARTIALLY_PAID: "Partiellement payée",
    PAID: "Payée",
    OVERPAID: "Payée avec excédent",
    CANCELED: "Annulée",
    DRAFT: "Brouillon",
    UNKNOWN: "Inconnu",
  };

  return labels[status];
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Date non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
