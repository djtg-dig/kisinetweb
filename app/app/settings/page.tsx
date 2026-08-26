"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  ApiAuthError,
  getAccountSession,
  getUserPharmacies,
  type PharmacySummary,
} from "@/lib/api";
import {
  createReferralPayoutAccount,
  getReferralPayoutAccounts,
  updateReferralPayoutAccount,
  type ReferralPayoutAccount,
} from "@/lib/api/referrals";
import {
  getAccessToken,
  getActivePharmacyId,
  logout,
} from "@/lib/auth";
import { carriAccountLoginUrl } from "@/lib/carri-account";

type PageState = "loading" | "anonymous" | "ready";

export default function AccountSettingsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [activePharmacyId, setActivePharmacyId] = useState("");
  const [activePharmacy, setActivePharmacy] = useState<PharmacySummary | null>(null);
  const [pharmacyCount, setPharmacyCount] = useState(0);
  const [pharmacyLoadMessage, setPharmacyLoadMessage] = useState("");
  const [payoutAccounts, setPayoutAccounts] = useState<ReferralPayoutAccount[]>([]);

  useEffect(() => {
    async function loadSettingsContext() {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setState("anonymous");
        return;
      }

      const storedPharmacyId = getActivePharmacyId();
      setActivePharmacyId(storedPharmacyId);

      try {
        await getAccountSession();
        const [pharmacies, accounts] = await Promise.all([
          getUserPharmacies(),
          getReferralPayoutAccounts(),
        ]);
        setPharmacyCount(pharmacies.length);
        setPayoutAccounts(accounts);
        setActivePharmacy(
          pharmacies.find((pharmacy) => pharmacy.id === storedPharmacyId) || null,
        );
      } catch (error) {
        if (error instanceof ApiAuthError) {
          setState("anonymous");
          return;
        }

        setPharmacyLoadMessage(
          "Les informations de pharmacie ne sont pas disponibles pour le moment.",
        );
      } finally {
        setState("ready");
      }
    }

    loadSettingsContext();
  }, []);

  const activePharmacySettingsHref = useMemo(() => {
    if (!activePharmacyId) {
      return "";
    }

    return "/app/pharmacies/" + activePharmacyId + "/settings";
  }, [activePharmacyId]);

  return (
    <MainLayout>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Compte</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Paramètres généraux</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Gérez les préférences liées à votre compte Kisinet, sans modifier les
              paramètres métier d'une pharmacie précise.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement des paramètres" className="min-h-[220px]" />
          </section>
        )}

        {state === "anonymous" && <AnonymousState />}

        {state === "ready" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <ActivePharmacyPanel
                activePharmacy={activePharmacy}
                activePharmacyId={activePharmacyId}
                activePharmacySettingsHref={activePharmacySettingsHref}
                pharmacyCount={pharmacyCount}
                message={pharmacyLoadMessage}
              />

              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Préférences</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Confort d'utilisation</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Langue" value="Français" />
                  <InfoTile label="Connexion" value="Carri Account" />
                  <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
                    <p className="text-xs font-semibold text-app-muted">Thème</p>
                    <div className="mt-2">
                      <ThemeSwitcher />
                    </div>
                  </div>
                  <InfoTile label="Espace actif" value={activePharmacyId || "Non sélectionné"} />
                </div>
              </section>

              <PayoutAccountPanel
                accounts={payoutAccounts}
                onAccountsChange={setPayoutAccounts}
              />
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Raccourcis</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Accès rapides</h2>
                <div className="mt-5 grid gap-3">
                  <SettingsLink
                    href="/app/compte"
                    title="Compte"
                    description="Consulter les informations de votre compte."
                  />
                  <SettingsLink
                    href="/app/select-pharmacy"
                    title="Mes pharmacies"
                    description="Changer de pharmacie ou ouvrir un espace de travail."
                  />
                  <SettingsLink
                    href="/app/pharmacies/create"
                    title="Créer une pharmacie"
                    description="Ajouter une nouvelle pharmacie à votre compte."
                  />
                  <SettingsLink
                    href="/tarifs"
                    title="Tarifs"
                    description="Consulter les offres disponibles."
                  />
                  <SettingsLink
                    href="/help"
                    title="Aide"
                    description="Trouver une assistance ou une information utile."
                  />
                </div>
              </section>

              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Sécurité</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Session</h2>
                <p className="mt-3 text-sm leading-6 text-app-muted">
                  La connexion à Kisinet passe par Carri Account. Vous pouvez fermer
                  votre session sur cet appareil.
                </p>
                <Button onClick={logout} variant="secondary" className="mt-5 w-full sm:w-auto">
                  Déconnexion
                </Button>
              </section>
            </aside>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

function PayoutAccountPanel({
  accounts,
  onAccountsChange,
}: {
  accounts: ReferralPayoutAccount[];
  onAccountsChange: (accounts: ReferralPayoutAccount[]) => void;
}) {
  const [currency, setCurrency] = useState(accounts[0]?.currency || "USD");
  const [provider, setProvider] = useState(accounts[0]?.provider || "AGREGATEUR");
  const [paymentMethod, setPaymentMethod] = useState(accounts[0]?.payment_method || "MOBILE_MONEY");
  const [operator, setOperator] = useState(accounts[0]?.operator || "");
  const [phoneNumber, setPhoneNumber] = useState(accounts[0]?.phone_number || "");
  const [accountName, setAccountName] = useState(accounts[0]?.account_name || "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const account = accounts[0];
    if (!account || phoneNumber || accountName || operator) {
      return;
    }
    setCurrency(account.currency);
    setProvider(account.provider);
    setPaymentMethod(account.payment_method);
    setOperator(account.operator);
    setPhoneNumber(account.phone_number);
    setAccountName(account.account_name);
  }, [accounts, accountName, operator, phoneNumber]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const payload = {
      currency,
      provider,
      payment_method: paymentMethod,
      operator,
      phone_number: phoneNumber,
      account_name: accountName,
      is_active: true,
    };

    try {
      const existing = accounts.find((account) => account.currency === currency);
      const saved = existing
        ? await updateReferralPayoutAccount(existing.reference, payload)
        : await createReferralPayoutAccount(payload);
      const nextAccounts = existing
        ? accounts.map((account) => (account.reference === saved.reference ? saved : account))
        : [saved, ...accounts];
      onAccountsChange(nextAccounts);
      setMessage("Compte de retrait enregistré.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Impossible d'enregistrer le compte de retrait.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Retraits de commissions</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Compte de réception</h2>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        Ce compte est utilisé pour recevoir les retraits groupés de vos commissions
        de parrainage. Les demandes de retrait copieront ces informations au moment
        de l'envoi.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">

        <label className="block text-sm font-semibold text-app-text">
          Systeme de paiement
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Virement bancaire</option>
          </select>
        </label>

          <label className="block text-sm font-semibold text-app-text">
          Prestataire
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            <option value="AGREGATEUR">M-pesa</option>
            <option value="AGREGATEUR">Orange money</option>
            <option value="MOBILE_MONEY">....</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-app-text">
          Numero du Compte
          <input
            value={operator}
            onChange={(event) => setOperator(event.target.value)}
            placeholder="MPESA"
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        </label>

        <label className="block text-sm font-semibold text-app-text">
          Téléphone
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+243XXXXXXXXX"
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        </label>

        <label className="block text-sm font-semibold text-app-text">
          Nom du bénéficiaire
          <input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
        </label>

        {message && (
          <p className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted sm:col-span-2">
            {message}
          </p>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer le compte"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function AnonymousState() {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Connexion requise</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Paramètres indisponibles</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Connectez-vous avec Carri Account pour accéder aux paramètres de votre
        compte Kisinet.
      </p>
      <LinkButton href={carriAccountLoginUrl} className="mt-5">
        Se connecter
      </LinkButton>
    </section>
  );
}

function ActivePharmacyPanel({
  activePharmacy,
  activePharmacyId,
  activePharmacySettingsHref,
  pharmacyCount,
  message,
}: {
  activePharmacy: PharmacySummary | null;
  activePharmacyId: string;
  activePharmacySettingsHref: string;
  pharmacyCount: number;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Pharmacie active</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">
        {activePharmacy?.name || "Aucune pharmacie active"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        {activePharmacy
          ? "Les paramètres métier restent disponibles depuis l'espace de cette pharmacie."
          : "Sélectionnez une pharmacie pour accéder à ses paramètres métier."}
      </p>

      {message && (
        <p className="mt-4 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
          {message}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoTile label="Pharmacies accessibles" value={String(pharmacyCount)} />
        <InfoTile label="Référence active" value={activePharmacyId || "Non sélectionnée"} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/app/select-pharmacy" variant="secondary">
          Changer de pharmacie
        </LinkButton>
        {activePharmacySettingsHref && (
          <LinkButton href={activePharmacySettingsHref}>
            Paramètres de la pharmacie
          </LinkButton>
        )}
      </div>
    </section>
  );
}

function SettingsLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-md border border-app-border bg-app-surface px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50"
    >
      <span className="block text-sm font-semibold text-app-text">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-app-muted">{description}</span>
    </a>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value}</p>
    </div>
  );
}
