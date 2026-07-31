"use client";

import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAccountProfile, getUserPharmacies, type AccountProfile, type PharmacySummary } from "@/lib/api";
import {
  getReferralOverview,
  type ReferralWalletSummary,
} from "@/lib/api/referrals";

type PageState = "loading" | "error" | "ready";

/**
 * Page "Mon compte" accessible via /app/compte.
 * Regroupe trois rubriques :
 * - Mes infos personnelles
 * - Parrainage
 * - Statistiques
 */
export default function AccountPage() {
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacySummary[]>([]);
  // Soldes du parrainage (portefeuilles)
  const [wallets, setWallets] = useState<ReferralWalletSummary[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      setState("loading");
      setErrorMessage("");

      try {
        // Chargement parallèle du profil, des pharmacies et du parrainage
        const [profileData, pharmaciesData, referralWallets] = await Promise.all([
          getAccountProfile(),
          getUserPharmacies(),
          getReferralOverview().catch(() => [] as ReferralWalletSummary[]),
        ]);

        if (!isMounted) return;

        setProfile(profileData);
        setPharmacies(pharmaciesData);
        setWallets(referralWallets);
        setState("ready");
      } catch (error) {
        if (!isMounted) return;

        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les informations de votre compte.");
        setState("error");
      }
    }

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <MainLayout>
      {/* En-tête de la page */}
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Compte</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Mon compte</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Informations personnelles, statistiques et programme de parrainage.
            </p>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement du compte" className="min-h-[220px]" />
          </section>
        )}

        {state === "error" && (
          <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600">Erreur de chargement</p>
            <h2 className="mt-2 text-xl font-bold text-app-text">Compte indisponible</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">{errorMessage}</p>
            <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-5">
              Mes pharmacies
            </LinkButton>
          </section>
        )}

        {state === "ready" && profile && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Colonne principale : infos personnelles + parrainage */}
            <section className="space-y-6">
              {/* Rubrique 1 : Mes infos personnelles */}
              <PersonalInfoSection profile={profile} />

              {/* Rubrique 2 : Parrainage (aperçu du solde) */}
              <ReferralSection wallets={wallets} />
            </section>

            {/* Colonne latérale : statistiques */}
            <aside className="space-y-6">
              <StatisticsSection
                pharmacyCount={pharmacies.length}
                profile={profile}
              />
            </aside>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

// ──────────────────────────────────────────────────
// Rubrique 1 : Mes infos personnelles
// ──────────────────────────────────────────────────

function PersonalInfoSection({ profile }: { profile: AccountProfile }) {
  const fullName = useMemo(() => {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  }, [profile.firstName, profile.lastName]);

  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Identité</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Mes infos personnelles</h2>

      {/* Carte d'identité utilisateur */}
      <div className="mt-4 flex flex-col gap-4 border-b border-app-border pb-6 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary-600 text-xl font-bold text-white">
          {getInitials(profile)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold text-app-text">
            {fullName || "Utilisateur Kisinet"}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-app-muted">
            {profile.email || "Email non renseigné"}
          </p>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoRow label="Référence" value={profile.reference || "Non renseignée"} />
        <InfoRow label="Téléphone" value={profile.phoneNumber || "Non renseigné"} />
        <InfoRow label="Prénom" value={profile.firstName || "Non renseigné"} />
        <InfoRow label="Nom" value={profile.lastName || "Non renseigné"} />
        <InfoRow label="Créé le" value={formatDate(profile.dateJoined)} />
        <InfoRow label="Mis à jour le" value={formatDate(profile.updatedAt)} />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────
// Rubrique 2 : Parrainage (aperçu)
// ──────────────────────────────────────────────────

function ReferralSection({ wallets }: { wallets: ReferralWalletSummary[] }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Programme de parrainage</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Parrainage</h2>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        Suivez vos commissions et votre solde disponible.
      </p>

      {wallets.length === 0 ? (
        <p className="mt-5 text-sm text-app-muted">
          Aucune commission disponible pour le moment.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {wallets.map((wallet) => (
            <article
              key={wallet.currency}
              className="rounded-md border border-app-border bg-app-surface p-4"
            >
              <p className="text-sm font-semibold text-primary-700">{wallet.currency}</p>
              <p className="mt-1 text-2xl font-bold text-app-text">
                {wallet.available_balance}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Metric label="Gagné" value={wallet.earned_total} />
                <Metric label="En attente" value={wallet.pending_balance} />
                <Metric label="Réservé" value={wallet.reserved_balance} />
                <Metric label="Retiré" value={wallet.withdrawn_total} />
              </dl>
            </article>
          ))}
        </div>
      )}

      {/* Lien vers la page détaillée du parrainage */}
      <div className="mt-5">
        <LinkButton href="/app/referrals" variant="secondary">
          Voir les détails du parrainage
        </LinkButton>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────
// Rubrique 3 : Statistiques
// ──────────────────────────────────────────────────

function StatisticsSection({
  pharmacyCount,
  profile,
}: {
  pharmacyCount: number;
  profile: AccountProfile;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Aperçu</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Statistiques</h2>

      <div className="mt-5 grid gap-3">
        {/* Nombre de pharmacies */}
        <StatTile
          label="Pharmacies"
          value={String(pharmacyCount)}
          description="Pharmacies associées à votre compte."
        />

        {/* Âge du compte (approximatif) */}
        <StatTile
          label="Compte créé"
          value={profile.dateJoined ? formatRelativeDate(profile.dateJoined) : "—"}
          description="Date d'ouverture du compte."
        />

        {/* Email de contact */}
        <StatTile
          label="Email"
          value={profile.email || "—"}
          description="Adresse email principale."
        />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────
// Composants utilitaires réutilisables
// ──────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface p-3">
      <dt className="text-xs font-semibold uppercase text-app-muted">{label}</dt>
      <dd className="mt-1 font-bold text-app-text">{value}</dd>
    </div>
  );
}

function StatTile({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase text-app-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-app-text">{value}</p>
      <p className="mt-1 text-xs leading-5 text-app-muted">{description}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Fonctions utilitaires
// ──────────────────────────────────────────────────

function getInitials(profile: AccountProfile) {
  const names = [profile.firstName, profile.lastName].filter(Boolean);
  if (names.length) {
    return names.map((name) => name?.[0]).join("").slice(0, 2).toUpperCase();
  }

  return (profile.email?.[0] || "U").toUpperCase();
}

function formatDate(value?: string) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `Il y a ${diffMonths} mois`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `Il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
}