"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import {
  getPublicPharmacies,
  getPublicPharmacyFilterOptions,
  type PharmacySummary,
  type PublicPharmacyFilterOptions,
  type PublicPharmacyFilters,
} from "@/lib/api";

const initialFilters: PublicPharmacyFilters = {
  search: "",
  reference: "",
  name: "",
  country: "",
  cityOrProvince: "",
  neighborhood: "",
  hasEmail: "",
  hasPhone: "",
  ordering: "name",
  page: "1",
};

export default function PublicPharmaciesPage() {
  const [filters, setFilters] = useState<PublicPharmacyFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<PublicPharmacyFilters>(initialFilters);
  const [filterOptions, setFilterOptions] =
    useState<PublicPharmacyFilterOptions | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacySummary[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const selectedCountry = filters.country || appliedFilters.country;
  const cityOptions = useMemo(() => {
    const cities = filterOptions?.citiesOrProvinces || [];

    if (!selectedCountry) {
      return cities;
    }

    return cities.filter((city) => city.country === selectedCountry);
  }, [filterOptions?.citiesOrProvinces, selectedCountry]);

  const page = Number(appliedFilters.page || "1") || 1;
  const totalPages = Math.max(1, Math.ceil(count / 10));

  useEffect(() => {
    let isMounted = true;

    getPublicPharmacyFilterOptions()
      .then((options) => {
        if (isMounted) {
          setFilterOptions(options);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFilterOptions({
            countries: [],
            citiesOrProvinces: [],
            neighborhoods: [],
            orderings: [],
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    getPublicPharmacies(appliedFilters)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setPharmacies(data.results);
        setCount(data.count);
      })
      .catch((currentError: Error) => {
        if (!isMounted) {
          return;
        }

        setPharmacies([]);
        setCount(0);
        setError(currentError.message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [appliedFilters]);

  function updateFilter(name: keyof PublicPharmacyFilters, value: string) {
    setFilters((current) => {
      const next = { ...current, [name]: value, page: "1" };

      if (name === "country") {
        next.cityOrProvince = "";
      }

      return next;
    });
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...filters, page: "1" });
  }

  function resetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  function goToPage(nextPage: number) {
    const normalizedPage = String(Math.min(Math.max(nextPage, 1), totalPages));
    setFilters((current) => ({ ...current, page: normalizedPage }));
    setAppliedFilters((current) => ({ ...current, page: normalizedPage }));
  }

  return (
    <PublicLayout>
      <main className="bg-app-background">
        <section className="border-b border-app-border bg-app-surface">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
              Pharmacies
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold text-app-text sm:text-4xl">
              Annuaire public des pharmacies
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-app-muted sm:text-base">
              Retrouvez les pharmacies enregistrées sur Kisinet et filtrez par
              localisation ou information de contact.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <form
            onSubmit={submitFilters}
            className="h-fit rounded-lg border border-app-border bg-app-card p-4"
          >
            <div className="grid gap-4">
              <TextInput
                label="Recherche"
                value={filters.search || ""}
                onChange={(value) => updateFilter("search", value)}
                placeholder="Nom, ville, quartier..."
              />
              <SelectInput
                label="Pays"
                value={filters.country || ""}
                onChange={(value) => updateFilter("country", value)}
                options={filterOptions?.countries || []}
              />
              <SelectInput
                label="Ville ou province"
                value={filters.cityOrProvince || ""}
                onChange={(value) => updateFilter("cityOrProvince", value)}
                options={cityOptions}
              />
              <SelectInput
                label="Tri"
                value={filters.ordering || "name"}
                onChange={(value) => updateFilter("ordering", value)}
                options={
                  filterOptions?.orderings.length
                    ? filterOptions.orderings
                    : [
                        { value: "name", label: "Nom A-Z" },
                        { value: "-created_at", label: "Plus recentes" },
                      ]
                }
                includeEmpty={false}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className="mt-4 w-full rounded-md border border-app-border bg-app-background px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50"
            >
              {showAdvancedFilters ? "Masquer les filtres" : "Filtres avancés"}
            </button>

            {showAdvancedFilters && (
              <div className="mt-4 grid gap-4 border-t border-app-border pt-4">
                <TextInput
                  label="Référence"
                  value={filters.reference || ""}
                  onChange={(value) => updateFilter("reference", value)}
                  placeholder="PH..."
                />
                <TextInput
                  label="Nom"
                  value={filters.name || ""}
                  onChange={(value) => updateFilter("name", value)}
                  placeholder="Nom exact ou partiel"
                />
                <SelectInput
                  label="Quartier"
                  value={filters.neighborhood || ""}
                  onChange={(value) => updateFilter("neighborhood", value)}
                  options={filterOptions?.neighborhoods || []}
                />
                <SelectInput
                  label="Email"
                  value={filters.hasEmail || ""}
                  onChange={(value) => updateFilter("hasEmail", value)}
                  options={[
                    { value: "true", label: "Avec email" },
                    { value: "false", label: "Sans email" },
                  ]}
                />
                <SelectInput
                  label="Téléphone"
                  value={filters.hasPhone || ""}
                  onChange={(value) => updateFilter("hasPhone", value)}
                  options={[
                    { value: "true", label: "Avec téléphone" },
                    { value: "false", label: "Sans téléphone" },
                  ]}
                />
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Filtrer
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md border border-app-border bg-app-background px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50"
              >
                Réinitialiser
              </button>
            </div>
          </form>

          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-app-text">
                {count} pharmacie{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-app-muted">
                Page {page} sur {totalPages}
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-lg border border-app-border bg-app-card"
                  />
                ))}
              </div>
            ) : pharmacies.length ? (
              <div className="grid gap-4">
                {pharmacies.map((pharmacy) => (
                  <PharmacyCard
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                  />
                ))}
              </div>
            ) : (
              !error && (
                <div className="rounded-lg border border-app-border bg-app-card p-8 text-center">
                  <h2 className="text-lg font-semibold text-app-text">
                    Aucune pharmacie trouvée
                  </h2>
                  <p className="mt-2 text-sm text-app-muted">
                    Ajustez vos filtres pour élargir la recherche.
                  </p>
                </div>
              )
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(page - 1)}
                className="rounded-md border border-app-border bg-app-card px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => goToPage(page + 1)}
                className="rounded-md border border-app-border bg-app-card px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function PharmacyCard({ pharmacy }: { pharmacy: PharmacySummary }) {
  return (
    <article className="rounded-lg border border-app-border bg-app-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            {pharmacy.reference}
          </p>
          <h2 className="mt-1 text-xl font-bold text-app-text">{pharmacy.name}</h2>
          <p className="mt-2 text-sm leading-6 text-app-muted">
            {pharmacy.addressLine || "Adresse non renseignée"}
          </p>
        </div>
        <a
          href={"/pharmacies/" + encodeURIComponent(pharmacy.reference || pharmacy.id)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 sm:w-auto"
        >
          Plus
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        {pharmacy.country && (
          <span className="rounded-full bg-success-50 px-3 py-1 text-success-700 ring-1 ring-success-100">
            {pharmacy.country}
          </span>
        )}
        {pharmacy.cityOrProvince && (
          <span className="rounded-full bg-info/10 px-3 py-1 text-cyan-700 ring-1 ring-info/20">
            {pharmacy.cityOrProvince}
          </span>
        )}
      </div>

    </article>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-app-text">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition placeholder:text-app-muted focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  includeEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  includeEmpty?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-app-text">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
      >
        {includeEmpty && <option value="">Tous</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
