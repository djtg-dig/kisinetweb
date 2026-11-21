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
  createUserPaymentAccount,
  getMobileMoneyProviders,
  getUserPaymentAccounts,
  setDefaultUserPaymentAccount,
  updateUserPaymentAccount,
  type MobileMoneyProvider,
  type UserPaymentAccount,
} from "@/lib/api/user-payment-accounts";
import {
  getActivePharmacyId,
  logout,
} from "@/lib/auth";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import { useSession } from "@/lib/hooks/use-session";

type PageState = "loading" | "anonymous" | "error" | "ready";

export default function AccountSettingsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [activePharmacyId, setActivePharmacyId] = useState("");
  const [activePharmacy, setActivePharmacy] = useState<PharmacySummary | null>(null);
  const [pharmacyCount, setPharmacyCount] = useState(0);
  const [pharmacyLoadMessage, setPharmacyLoadMessage] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState<UserPaymentAccount[]>([]);
  const [mobileMoneyProviders, setMobileMoneyProviders] = useState<MobileMoneyProvider[]>([]);
  const {
    authenticated,
    error: sessionError,
    loading: sessionLoading,
    refreshSession,
  } = useSession();

  useEffect(() => {
    async function loadSettingsContext() {
      if (sessionLoading) {
        setState("loading");
        return;
      }

      if (sessionError) {
        setState("error");
        return;
      }

      if (!authenticated) {
        setState("anonymous");
        return;
      }

      const storedPharmacyId = getActivePharmacyId();
      setActivePharmacyId(storedPharmacyId);

      try {
        await getAccountSession();
        const [pharmacies, accounts, providers] = await Promise.all([
          getUserPharmacies(),
          getUserPaymentAccounts(),
          getMobileMoneyProviders(),
        ]);
        setPharmacyCount(pharmacies.length);
        setPaymentAccounts(accounts);
        setMobileMoneyProviders(providers);
        setActivePharmacy(
          pharmacies.find((pharmacy) => pharmacy.id === storedPharmacyId) || null,
        );
        setState("ready");
      } catch (error) {
        if (error instanceof ApiAuthError) {
          setState("anonymous");
          return;
        }

        setPharmacyLoadMessage(
          "Les informations de pharmacie ne sont pas disponibles pour le moment.",
        );
        setState("ready");
      }
    }

    loadSettingsContext();
  }, [authenticated, sessionError, sessionLoading]);

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

        {state === "error" && (
          <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-700">Paramètres indisponibles</p>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              Impossible de vérifier votre session pour le moment. Votre connexion n&apos;a pas été supprimée.
            </p>
            <Button onClick={() => void refreshSession()} className="mt-5">
              Réessayer
            </Button>
          </section>
        )}

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

              <PayoutAccountPanel accounts={paymentAccounts} providers={mobileMoneyProviders} onAccountsChange={setPaymentAccounts} />
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
  providers,
  onAccountsChange,
}: {
  accounts: UserPaymentAccount[];
  providers: MobileMoneyProvider[];
  onAccountsChange: (accounts: UserPaymentAccount[]) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [providerId, setProviderId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!providerId && providers[0]) setProviderId(String(providers[0].id));
  }, [providerId, providers]);

  function resetForm() {
    setEditingId(null);
    setPhoneNumber("");
    setAccountName("");
    setIsDefault(false);
  }

  function editAccount(account: UserPaymentAccount) {
    setEditingId(account.id);
    setProviderId(String(account.mobileMoneyProvider || providers[0]?.id || ""));
    setPhoneNumber("");
    setAccountName(account.accountName);
    setIsDefault(account.isDefault);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const mobileMoneyProvider = Number(providerId);
    if (!mobileMoneyProvider || (!editingId && !phoneNumber.trim())) {
      setMessage("Sélectionnez un opérateur et renseignez le numéro Mobile Money.");
      return;
    }
    setIsSubmitting(true);

    try {
      const saved = editingId
        ? await updateUserPaymentAccount(editingId, {
          mobileMoneyProvider,
          ...(phoneNumber.trim() ? { accountIdentifier: phoneNumber.trim() } : {}),
          accountName: accountName.trim(),
          isDefault,
        })
        : await createUserPaymentAccount({
          mobileMoneyProvider,
          accountIdentifier: phoneNumber.trim(),
          accountName: accountName.trim(),
          isDefault,
        });
      const nextAccounts = editingId
        ? accounts.map((account) => account.id === saved.id ? saved : saved.isDefault ? { ...account, isDefault: false } : account)
        : [saved, ...accounts.map((account) => saved.isDefault ? { ...account, isDefault: false } : account)];
      onAccountsChange(nextAccounts);
      setMessage("Compte de retrait enregistré.");
      resetForm();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Impossible d'enregistrer le compte de retrait.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="withdrawal-accounts" className="scroll-mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Retraits de commissions</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Mes comptes de retrait</h2>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        Enregistrez les comptes Mobile Money qui pourront recevoir vos commissions.
        Le pays et la devise sont confirmés lors de chaque demande de retrait.
      </p>

      <div className="mt-5 space-y-3">
        {accounts.length ? accounts.map((account) => {
          const provider = providers.find((item) => item.id === account.mobileMoneyProvider);
          return <article key={account.id} className="rounded-md border border-app-border bg-app-surface p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-app-text">{provider?.name || "Mobile Money"} · {account.accountIdentifierMasked}</p><p className="mt-1 text-sm text-app-muted">{account.accountName || "Bénéficiaire non renseigné"}{account.isDefault ? " · Compte par défaut" : ""}{!account.isActive ? " · Désactivé" : ""}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => editAccount(account)}>Modifier</Button>{account.isActive && !account.isDefault && <Button type="button" variant="secondary" onClick={async () => { const saved = await setDefaultUserPaymentAccount(account.id); onAccountsChange(accounts.map((item) => item.id === saved.id ? saved : { ...item, isDefault: false })); }}>Par défaut</Button>}{account.isActive && <Button type="button" variant="secondary" onClick={async () => { const saved = await updateUserPaymentAccount(account.id, { isActive: false }); onAccountsChange(accounts.map((item) => item.id === saved.id ? saved : item)); }}>Désactiver</Button>}</div></div></article>;
        }) : <p className="rounded-md border border-app-border bg-app-surface p-4 text-sm text-app-muted">Aucun compte Mobile Money enregistré.</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-app-text">Opérateur Mobile Money<select value={providerId} onChange={(event) => setProviderId(event.target.value)} required className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"><option value="">Sélectionner un opérateur</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
        <label className="block text-sm font-semibold text-app-text">Numéro Mobile Money<input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder={editingId ? "Laisser vide pour conserver le numéro" : "+243XXXXXXXXX"} required={!editingId} className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" /></label>
        <label className="block text-sm font-semibold text-app-text">Nom du bénéficiaire (facultatif)<input value={accountName} onChange={(event) => setAccountName(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" /></label>
        <label className="flex min-h-11 items-center gap-3 self-end text-sm font-semibold text-app-text"><input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} className="h-4 w-4 accent-primary-600" /> Définir comme compte par défaut</label>
        {message && <p role="status" className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted sm:col-span-2">{message}</p>}
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row"><Button type="submit" disabled={isSubmitting || !providers.length}>{isSubmitting ? "Enregistrement..." : editingId ? "Mettre à jour le compte" : "Ajouter un compte Mobile Money"}</Button>{editingId && <Button type="button" variant="secondary" onClick={resetForm}>Annuler</Button>}</div>
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
