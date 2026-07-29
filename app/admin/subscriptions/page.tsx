"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAdminSubscriptions, type AdminSubscription } from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

type SubscriptionFilters = {
  search: string;
  reference: string;
  planCode: string;
  status: string;
};

type SubscriptionColumn = {
  key: keyof AdminSubscription;
  label: string;
  className?: string;
  render?: (subscription: AdminSubscription) => string | number | ReactNode;
};

const emptyFilters: SubscriptionFilters = {
  search: "",
  reference: "",
  planCode: "",
  status: "",
};

const subscriptionColumns: SubscriptionColumn[] = [
  { key: "reference", label: "Réf. abonnement", className: "font-mono text-[11px] text-app-muted" },
  { key: "pharmacy_reference", label: "Réf. pharmacie", className: "font-mono text-[11px] text-app-muted" },
  { key: "pharmacy_name", label: "Pharmacie", className: "font-semibold text-app-text" },
  { key: "pharmacy_email", label: "Email pharmacie", className: "max-w-[220px] truncate" },
  { key: "pharmacy_phone_number", label: "Téléphone pharmacie" },
  { key: "owner_reference", label: "Réf. propriétaire", className: "font-mono text-[11px]" },
  { key: "owner_email", label: "Email propriétaire", className: "max-w-[220px] truncate" },
  { key: "owner_first_name", label: "Prénom propriétaire" },
  { key: "owner_last_name", label: "Nom propriétaire" },
  { key: "plan_code", label: "Plan" },
  { key: "plan_name", label: "Nom plan" },
  { key: "status", label: "Statut" },
  { key: "duration_months", label: "Durée (mois)" },
  {
    key: "auto_renew",
    label: "Renouvellement auto",
    render: (subscription) => (subscription.auto_renew ? "Oui" : "Non"),
  },
  {
    key: "is_trial_active",
    label: "Essai actif",
    render: (subscription) => (subscription.is_trial_active ? "Oui" : "Non"),
  },
  {
    key: "is_active",
    label: "Actif",
    render: (subscription) => (subscription.is_active ? "Oui" : "Non"),
  },
  { key: "starts_at", label: "Début", render: (subscription) => formatDate(subscription.starts_at) },
  {
    key: "trial_starts_at",
    label: "Début essai",
    render: (subscription) => formatDate(subscription.trial_starts_at),
  },
  {
    key: "trial_ends_at",
    label: "Fin essai",
    render: (subscription) => formatDate(subscription.trial_ends_at),
  },
  { key: "expires_at", label: "Expiration", render: (subscription) => formatDate(subscription.expires_at) },
  { key: "payments_count", label: "Paiements" },
  { key: "last_payment_reference", label: "Réf. paiement", className: "font-mono text-[11px]" },
  { key: "last_payment_status", label: "Statut paiement" },
  { key: "last_payment_amount", label: "Montant dernier paiement" },
  { key: "discount_percentage", label: "Remise (%)" },
  { key: "total_amount", label: "Montant total" },
  { key: "created_at", label: "Création", render: (subscription) => formatDate(subscription.created_at) },
  { key: "updated_at", label: "Mise à jour", render: (subscription) => formatDate(subscription.updated_at) },
];

export default function AdminSubscriptionsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState<SubscriptionFilters>(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<SubscriptionFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedFilters(normalizeFilters(filters));
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    let isCurrent = true;

    async function loadSubscriptions() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminSubscriptions({
          ...debouncedFilters,
          page,
        });
        if (!isCurrent) {
          return;
        }
        setSubscriptions(data.results);
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
          error instanceof Error ? error.message : "Impossible de charger les abonnements.",
        );
      }
    }

    void loadSubscriptions();

    return () => {
      isCurrent = false;
    };
  }, [debouncedFilters, page, refreshIndex]);

  function updateFilter(name: keyof SubscriptionFilters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setFilters(emptyFilters);
    setDebouncedFilters(emptyFilters);
    setPage(1);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Admin-Abonnement</p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Abonnements</h2>
            <p className="mt-2 text-sm text-app-muted">
              {count} abonnement{count > 1 ? "s" : ""} trouvé{count > 1 ? "s" : ""}.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput
            label="Recherche"
            value={filters.search}
            onChange={(value) => updateFilter("search", value)}
            placeholder="Réf., nom, email plan / pharmacie"
          />
          <FilterInput
            label="Réf. abonnement"
            value={filters.reference}
            onChange={(value) => updateFilter("reference", value)}
            placeholder="SUBXXXXXXXX"
          />
          <FilterSelect
            label="Plan"
            value={filters.planCode}
            onChange={(value) => updateFilter("planCode", value)}
            options={[
              ["", "Tous"],
              ["BASIC", "BASIC"],
              ["PREMIUM", "PREMIUM"],
              ["PRO", "PRO"],
            ]}
          />
          <FilterSelect
            label="Statut"
            value={filters.status}
            onChange={(value) => updateFilter("status", value)}
            options={[
              ["", "Tous"],
              ["ACTIVE", "Actif"],
              ["EXPIRED", "Expiré"],
              ["CANCELED", "Annulé"],
              ["PENDING", "En attente"],
            ]}
          />
        </div>
        <p className="mt-3 text-xs text-app-muted">Recherche et filtres automatiques après une courte pause.</p>
      </div>

      {state === "loading" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des abonnements" className="min-h-[260px]" />
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
            <table className="min-w-[3300px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  {subscriptionColumns.map((column, index) => (
                    <th className="px-3 py-3" key={`${column.key}-${index}`}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="align-top">
                    {subscriptionColumns.map((column, index) => (
                      <td
                        className={`px-3 py-3 text-app-muted ${column.className || ""}`}
                        key={`${column.key}-${index}`}
                      >
                        {column.render
                          ? column.render(subscription)
                          : formatValue(subscription[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!subscriptions.length && (
            <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
              Aucun abonnement trouvé.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-app-muted">
              Page {page} · 10 lignes maximum par page · {count} résultat{count > 1 ? "s" : ""}
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

function FilterInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold text-app-text">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
    </label>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold text-app-text">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "all"} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function normalizeFilters(filters: SubscriptionFilters): SubscriptionFilters {
  return {
    search: filters.search.trim(),
    reference: filters.reference.trim().toUpperCase(),
    planCode: filters.planCode.trim().toUpperCase(),
    status: filters.status.trim().toUpperCase(),
  };
}

function formatDate(value: string | null) {
  return value || "-";
}

function formatValue(value: string | number | null | boolean) {
  if (value === null || value === "") {
    return "-";
  }
  return String(value);
}
