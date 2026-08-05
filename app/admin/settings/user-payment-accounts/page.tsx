"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaymentSettingsLayout } from "@/components/admin/payment-settings-layout";
import {
  ReadOnlyNotice,
  YesNoBadge,
} from "@/components/admin/user-payment-account-view";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  findAccountProvider,
  formatDateTime,
  resolveProviderCountryLabel,
  resolveProviderLabel,
  resolveUserLabel,
} from "@/lib/admin/user-payment-accounts";
import {
  getAdminCountries,
  getAdminPaymentProviders,
  getAdminUserPaymentAccounts,
  getAdminUsersDirectory,
  type AdminCountryOption,
  type AdminPaymentProvider,
  type AdminProfile,
  type AdminUserPaymentAccount,
} from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

// Filtre "actif" envoyé au backend : "" (tous), "true" ou "false".
type ActiveFilter = "" | "true" | "false";

// L'endpoint admin des comptes de paiement renvoie la liste complète (le
// backend ne pagine pas cette ressource) : la pagination est donc effectuée
// côté frontend sur les résultats déjà filtrés par l'API.
const pageSize = 10;

// Page de consultation des comptes de paiement des utilisateurs.
// IMPORTANT : cette page est en lecture seule. Elle n'appelle que des endpoints
// GET et ne doit jamais proposer de création, modification ou suppression.
export default function AdminUserPaymentAccountsPage() {
  const [accounts, setAccounts] = useState<AdminUserPaymentAccount[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [page, setPage] = useState(1);

  // Données de référence servant uniquement à afficher des libellés lisibles
  // (l'API des comptes ne renvoie que des identifiants).
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [countries, setCountries] = useState<AdminCountryOption[]>([]);
  const [users, setUsers] = useState<AdminProfile[]>([]);

  // Recherche envoyée au backend après une courte pause de saisie.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  // Liste principale : rechargée à chaque changement de recherche ou de filtre.
  useEffect(() => {
    let isCurrent = true;

    async function loadAccounts() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminUserPaymentAccounts({
          search: debouncedSearch,
          isActive: activeFilter,
        });
        if (!isCurrent) {
          return;
        }
        setAccounts(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Impossible de charger les comptes.",
        );
      }
    }

    void loadAccounts();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch, activeFilter, refreshIndex]);

  // Données de référence chargées une seule fois. Les échecs sont isolés :
  // un appel en erreur n'empêche pas l'affichage du tableau.
  useEffect(() => {
    let isCurrent = true;

    async function loadReferenceData() {
      const [providersData, countriesData, usersData] = await Promise.allSettled([
        getAdminPaymentProviders(),
        getAdminCountries(),
        getAdminUsersDirectory(),
      ]);

      if (!isCurrent) {
        return;
      }

      if (providersData.status === "fulfilled") {
        setProviders(providersData.value);
      }
      if (countriesData.status === "fulfilled") {
        setCountries(countriesData.value);
      }
      if (usersData.status === "fulfilled") {
        setUsers(usersData.value);
      }
    }

    void loadReferenceData();

    return () => {
      isCurrent = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(accounts.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  // Découpage de la page courante (pagination frontend).
  const visibleAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return accounts.slice(start, start + pageSize);
  }, [accounts, currentPage]);

  return (
    <PaymentSettingsLayout>
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Administration</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">
              Comptes de paiement utilisateurs
            </h2>
            <p className="mt-2 text-sm text-app-muted">
              {accounts.length} compte{accounts.length > 1 ? "s" : ""} trouvé
              {accounts.length > 1 ? "s" : ""}.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <div className="flex w-full flex-col gap-2 sm:w-72">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-app-muted"
                htmlFor="account-search"
              >
                Recherche
              </label>
              <input
                id="account-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Numéro ou titulaire du compte"
                className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-48">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-app-muted"
                htmlFor="account-active-filter"
              >
                Statut
              </label>
              <select
                id="account-active-filter"
                value={activeFilter}
                onChange={(event) => {
                  setPage(1);
                  setActiveFilter(event.target.value as ActiveFilter);
                }}
                className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              >
                <option value="">Tous les comptes</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </select>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-app-muted">
          La recherche est automatique après une courte pause et porte sur le numéro et
          le titulaire du compte.
        </p>
      </div>

      <ReadOnlyNotice />

      {state === "loading" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des comptes de paiement" className="min-h-[220px]" />
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Chargement impossible</p>
          <p className="mt-2 text-sm text-app-muted">{message}</p>
          <Button onClick={() => setRefreshIndex((current) => current + 1)} className="mt-5">
            Réessayer
          </Button>
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  <th className="px-3 py-3">Utilisateur</th>
                  <th className="px-3 py-3">Fournisseur</th>
                  <th className="px-3 py-3">Titulaire</th>
                  <th className="px-3 py-3">Numéro</th>
                  <th className="px-3 py-3">Pays</th>
                  <th className="px-3 py-3">Devise</th>
                  <th className="px-3 py-3">Actif</th>
                  <th className="px-3 py-3">Principal</th>
                  <th className="px-3 py-3">Date création</th>
                  <th className="px-3 py-3 text-right">Consultation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {visibleAccounts.map((account) => {
                  const provider = findAccountProvider(account.provider, providers);

                  return (
                    <tr key={account.id} className="align-top">
                      <td className="max-w-[240px] truncate px-3 py-3 text-app-text">
                        {resolveUserLabel(account.user, users)}
                      </td>
                      <td className="px-3 py-3 text-app-text">
                        {resolveProviderLabel(account.provider, providers)}
                      </td>
                      <td className="px-3 py-3 text-app-muted">{account.account_name || "-"}</td>
                      <td className="px-3 py-3 font-mono text-app-text">
                        {account.account_identifier || "-"}
                      </td>
                      <td className="px-3 py-3 text-app-muted">
                        {resolveProviderCountryLabel(provider, countries)}
                      </td>
                      <td className="px-3 py-3 font-mono text-app-muted">
                        {account.currency_code || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <YesNoBadge value={account.is_active} trueLabel="Actif" falseLabel="Inactif" />
                      </td>
                      <td className="px-3 py-3">
                        <YesNoBadge value={account.is_default} />
                      </td>
                      <td className="px-3 py-3 text-app-muted">
                        {formatDateTime(account.created_at)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/admin/settings/user-payment-accounts/${account.id}`}
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs font-semibold text-app-text transition hover:bg-primary-50"
                        >
                          Voir le détail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!accounts.length && (
            <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
              Aucun compte de paiement ne correspond à cette recherche.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-app-muted">
              Page {currentPage} sur {totalPages} · {pageSize} lignes maximum par page ·{" "}
              {accounts.length} résultat{accounts.length > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}
    </PaymentSettingsLayout>
  );
}
