"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DetailRow,
  ReadOnlyNotice,
  YesNoBadge,
} from "@/components/admin/user-payment-account-view";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  findAccountProvider,
  findAccountUser,
  formatDateTime,
  resolveProviderCountryLabel,
  resolveProviderLabel,
} from "@/lib/admin/user-payment-accounts";
import {
  getAdminCountries,
  getAdminPaymentProviders,
  getAdminUserPaymentAccount,
  getAdminUsersDirectory,
  type AdminCountryOption,
  type AdminPaymentProvider,
  type AdminProfile,
  type AdminUserPaymentAccount,
} from "@/lib/api/admin";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

type PageState = "loading" | "ready" | "error";

const listPath = "/admin/settings/user-payment-accounts";

// Page détail d'un compte de paiement utilisateur.
// IMPORTANT : consultation uniquement. Elle n'appelle que des endpoints GET et
// ne propose aucun bouton de modification, d'activation ou de suppression.
export default function AdminUserPaymentAccountDetailPage({ params }: DetailPageProps) {
  const [accountId, setAccountId] = useState("");
  const [account, setAccount] = useState<AdminUserPaymentAccount | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Données de référence utilisées pour afficher des libellés lisibles.
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [countries, setCountries] = useState<AdminCountryOption[]>([]);
  const [users, setUsers] = useState<AdminProfile[]>([]);

  // Dans Next 15, `params` est une promesse : on la résout avant les appels API.
  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setAccountId(resolvedParams.id);
    }

    void readParams();
  }, [params]);

  // Détail du compte consulté.
  useEffect(() => {
    if (!accountId) {
      return;
    }

    let isCurrent = true;

    async function loadAccount() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminUserPaymentAccount(accountId);
        if (!isCurrent) {
          return;
        }
        setAccount(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Impossible de charger ce compte.",
        );
      }
    }

    void loadAccount();

    return () => {
      isCurrent = false;
    };
  }, [accountId, refreshIndex]);

  // Données de référence chargées une seule fois. Les échecs sont isolés pour
  // ne pas empêcher l'affichage du compte.
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

  const provider = account ? findAccountProvider(account.provider, providers) : null;
  const user = account ? findAccountUser(account.user, users) : null;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Administration</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Détail du compte de paiement</h2>
            <p className="mt-2 text-sm text-app-muted">
              Consultation d’un compte de paiement utilisateur.
            </p>
          </div>
          <Link
            href={listPath}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50"
          >
            Retour à la liste
          </Link>
        </div>
      </div>

      <ReadOnlyNotice>
        Ce compte appartient à un utilisateur : il est affiché à titre informatif et ne
        peut pas être modifié depuis l’administration.
      </ReadOnlyNotice>

      {state === "loading" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement du compte de paiement" className="min-h-[220px]" />
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

      {state === "ready" && account && (
        <div className="space-y-4">
          {/* Bloc 1 : informations sur l'utilisateur propriétaire du compte. */}
          <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-app-text">Informations utilisateur</h3>
            {!user && (
              <p className="mt-2 text-sm text-app-muted">
                Les informations détaillées de l’utilisateur ne sont pas disponibles :
                seul son identifiant est renvoyé par l’API des comptes de paiement.
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Identifiant utilisateur" value={account.user || "-"} />
              <DetailRow label="Email" value={user?.email || "-"} />
              <DetailRow label="Référence" value={user?.reference || "-"} />
              <DetailRow label="Prénom" value={user?.first_name || "-"} />
              <DetailRow label="Nom" value={user?.last_name || "-"} />
              <DetailRow label="Téléphone" value={user?.phone_number || "-"} />
              <DetailRow
                label="Utilisateur actif"
                value={user ? <YesNoBadge value={user.is_active} /> : "-"}
              />
              <DetailRow label="Inscription" value={formatDateTime(user?.date_joined)} />
              <DetailRow label="Dernière connexion" value={formatDateTime(user?.last_login)} />
            </div>
          </div>

          {/* Bloc 2 : informations de paiement (compte et fournisseur associé). */}
          <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-app-text">Informations de paiement</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Identifiant du compte" value={String(account.id)} />
              <DetailRow
                label="Fournisseur"
                value={resolveProviderLabel(account.provider, providers)}
              />
              <DetailRow label="Code fournisseur" value={provider?.code || "-"} />
              <DetailRow label="Titulaire" value={account.account_name || "-"} />
              <DetailRow
                label="Numéro"
                value={
                  <span className="font-mono">{account.account_identifier || "-"}</span>
                }
              />
              <DetailRow
                label="Pays"
                value={resolveProviderCountryLabel(provider, countries)}
              />
              <DetailRow
                label="Devise"
                value={
                  account.currency_code
                    ? `${account.currency_code}${
                        account.currency_name ? ` — ${account.currency_name}` : ""
                      }`
                    : "-"
                }
              />
              <DetailRow
                label="Actif"
                value={
                  <YesNoBadge value={account.is_active} trueLabel="Actif" falseLabel="Inactif" />
                }
              />
              <DetailRow label="Compte principal" value={<YesNoBadge value={account.is_default} />} />
              <DetailRow label="Vérifié" value={<YesNoBadge value={account.is_verified} />} />
            </div>
          </div>

          {/* Bloc 3 : historique. L'API ne fournit pas de journal d'événements,
              on affiche donc les seules dates disponibles sur le compte. */}
          <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-app-text">Historique</h3>
            <p className="mt-2 text-sm text-app-muted">
              L’API d’administration ne renvoie pas de journal détaillé pour un compte de
              paiement. Les dates ci-dessous sont les seules informations d’historique
              disponibles.
            </p>
            <ul className="mt-4 space-y-3">
              <li className="rounded-lg border border-app-border bg-app-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                  Création du compte
                </p>
                <p className="mt-1 text-sm font-semibold text-app-text">
                  {formatDateTime(account.created_at)}
                </p>
              </li>
              <li className="rounded-lg border border-app-border bg-app-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                  Dernière modification
                </p>
                <p className="mt-1 text-sm font-semibold text-app-text">
                  {formatDateTime(account.updated_at)}
                </p>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
