"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAdminPharmacies, type AdminPharmacy } from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

type PharmacyFilters = {
  search: string;
  devise: string;
  country: string;
  cityOrProvince: string;
  neighborhood: string;
  archived: string;
  hasEmail: string;
  hasPhone: string;
};

type PharmacyColumn = {
  key: keyof AdminPharmacy;
  label: string;
  className?: string;
  render?: (pharmacy: AdminPharmacy) => string | number | ReactNode;
};

const emptyFilters: PharmacyFilters = {
  search: "",
  devise: "",
  country: "",
  cityOrProvince: "",
  neighborhood: "",
  archived: "",
  hasEmail: "",
  hasPhone: "",
};

const pharmacyColumns: PharmacyColumn[] = [
  { key: "id", label: "ID", className: "font-mono text-[11px] text-app-muted" },
  { key: "reference", label: "Référence", className: "font-semibold text-app-text" },
  { key: "name", label: "Nom", className: "max-w-[220px] truncate text-app-text" },
  { key: "devise", label: "Devise" },
  { key: "slug", label: "Slug", className: "max-w-[180px] truncate" },
  { key: "email", label: "Email", className: "max-w-[220px] truncate" },
  { key: "phone_number", label: "Téléphone" },
  { key: "owner_id", label: "ID propriétaire", className: "font-mono text-[11px]" },
  { key: "owner_reference", label: "Réf. propriétaire" },
  { key: "owner_email", label: "Email propriétaire", className: "max-w-[220px] truncate" },
  { key: "owner_first_name", label: "Prénom propriétaire" },
  { key: "owner_last_name", label: "Nom propriétaire" },
  { key: "invited_by_id", label: "ID parrain", className: "font-mono text-[11px]" },
  { key: "invited_by_reference", label: "Réf. parrain" },
  { key: "invited_by_email", label: "Email parrain", className: "max-w-[220px] truncate" },
  { key: "address_id", label: "ID adresse", className: "font-mono text-[11px]" },
  { key: "country", label: "Pays" },
  { key: "country_phone_code", label: "Indicatif" },
  { key: "city_or_province", label: "Ville / Province" },
  { key: "neighborhood", label: "Quartier" },
  { key: "street", label: "Rue" },
  { key: "complement_adresse", label: "Complément", className: "max-w-[220px] truncate" },
  { key: "postal_code", label: "Code postal" },
  { key: "proximite_transports", label: "Transports", className: "max-w-[240px] truncate" },
  { key: "formatted_address", label: "Adresse formatée", className: "max-w-[280px] truncate" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
  { key: "members_count", label: "Membres" },
  { key: "active_members_count", label: "Membres actifs" },
  {
    key: "is_archived_at",
    label: "Archivée",
    render: (pharmacy) => <ArchiveBadge value={Boolean(pharmacy.is_archived_at)} />,
  },
  {
    key: "is_archived_at",
    label: "Date archivage",
    render: (pharmacy) => formatDate(pharmacy.is_archived_at),
  },
  { key: "created_at", label: "Création", render: (pharmacy) => formatDate(pharmacy.created_at) },
  { key: "updated_at", label: "Mise à jour", render: (pharmacy) => formatDate(pharmacy.updated_at) },
];

export default function AdminPharmaciesPage() {
  const [state, setState] = useState<PageState>("loading");
  const [pharmacies, setPharmacies] = useState<AdminPharmacy[]>([]);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState<PharmacyFilters>(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<PharmacyFilters>(emptyFilters);
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

    async function loadPharmacies() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminPharmacies({
          ...debouncedFilters,
          page,
        });
        if (!isCurrent) {
          return;
        }
        setPharmacies(data.results);
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
          error instanceof Error ? error.message : "Impossible de charger les pharmacies.",
        );
      }
    }

    void loadPharmacies();

    return () => {
      isCurrent = false;
    };
  }, [debouncedFilters, page, refreshIndex]);

  function updateFilter(name: keyof PharmacyFilters, value: string) {
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
        <p className="text-sm font-semibold text-primary-700">Admin-Pharmacy</p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Pharmacies</h2>
            <p className="mt-2 text-sm text-app-muted">
              {count} pharmacie{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}.
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
            placeholder="Nom, référence, email, propriétaire"
          />
          <FilterInput
            label="Pays"
            value={filters.country}
            onChange={(value) => updateFilter("country", value)}
            placeholder="CD, +243, Congo"
          />
          <FilterInput
            label="Ville / Province"
            value={filters.cityOrProvince}
            onChange={(value) => updateFilter("cityOrProvince", value)}
            placeholder="Kinshasa"
          />
          <FilterInput
            label="Quartier"
            value={filters.neighborhood}
            onChange={(value) => updateFilter("neighborhood", value)}
            placeholder="Gombe"
          />
          <FilterSelect
            label="Devise"
            value={filters.devise}
            onChange={(value) => updateFilter("devise", value)}
            options={[
              ["", "Toutes"],
              ["USD", "USD"],
              ["CDF", "CDF"],
            ]}
          />
          <FilterSelect
            label="Archivage"
            value={filters.archived}
            onChange={(value) => updateFilter("archived", value)}
            options={[
              ["", "Toutes"],
              ["false", "Actives"],
              ["true", "Archivées"],
            ]}
          />
          <FilterSelect
            label="Email"
            value={filters.hasEmail}
            onChange={(value) => updateFilter("hasEmail", value)}
            options={[
              ["", "Toutes"],
              ["true", "Avec email"],
              ["false", "Sans email"],
            ]}
          />
          <FilterSelect
            label="Téléphone"
            value={filters.hasPhone}
            onChange={(value) => updateFilter("hasPhone", value)}
            options={[
              ["", "Toutes"],
              ["true", "Avec téléphone"],
              ["false", "Sans téléphone"],
            ]}
          />
        </div>
        <p className="mt-3 text-xs text-app-muted">Recherche et filtres automatiques après une courte pause.</p>
      </div>

      {state === "loading" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des pharmacies" className="min-h-[260px]" />
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
                  {pharmacyColumns.map((column, index) => (
                    <th className="px-3 py-3" key={`${column.key}-${index}`}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id} className="align-top">
                    {pharmacyColumns.map((column, index) => (
                      <td
                        className={`px-3 py-3 text-app-muted ${column.className || ""}`}
                        key={`${column.key}-${index}`}
                      >
                        {column.render
                          ? column.render(pharmacy)
                          : formatValue(pharmacy[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!pharmacies.length && (
            <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
              Aucune pharmacie trouvée.
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

function normalizeFilters(filters: PharmacyFilters): PharmacyFilters {
  return {
    search: filters.search.trim(),
    devise: filters.devise.trim().toUpperCase(),
    country: filters.country.trim(),
    cityOrProvince: filters.cityOrProvince.trim(),
    neighborhood: filters.neighborhood.trim(),
    archived: filters.archived.trim(),
    hasEmail: filters.hasEmail.trim(),
    hasPhone: filters.hasPhone.trim(),
  };
}

function formatDate(value: string | null) {
  return value || "-";
}

function formatValue(value: string | number | null) {
  if (value === null || value === "") {
    return "-";
  }
  return String(value);
}

function ArchiveBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
        value
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {value ? "Oui" : "Non"}
    </span>
  );
}
