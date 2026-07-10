"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAccountProfile, type AccountProfile } from "@/lib/api";

type ProfilePageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "ready";

export default function AccountProfilePage({ params }: ProfilePageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }

    readParams();
  }, [params]);

  useEffect(() => {
    async function loadProfile() {
      setState("loading");
      setErrorMessage("");

      try {
        const data = await getAccountProfile();
        setProfile(data);
        setState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger votre profil.");
        setState("error");
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-background text-app-text lg:min-h-[calc(100vh-4.5rem)]">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Compte</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Mon profil</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Informations associées à votre compte Kisinet connecté.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement du profil" className="min-h-[220px]" />
          </section>
        )}
        {state === "error" && <ErrorState message={errorMessage} pharmacyId={pharmacyId} />}
        {state === "ready" && profile && (
          <ProfileContent profile={profile} pharmacyId={pharmacyId} />
        )}
      </main>
    </div>
  );
}

function ProfileContent({
  profile,
  pharmacyId,
}: {
  profile: AccountProfile;
  pharmacyId: string;
}) {
  const fullName = useMemo(() => {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  }, [profile.firstName, profile.lastName]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-app-border pb-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary-600 text-xl font-bold text-white">
            {getInitials(profile)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-app-text">
              {fullName || "Utilisateur Kisinet"}
            </h2>
            <p className="mt-1 truncate text-sm font-medium text-app-muted">
              {profile.email || "Email non renseigné"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Référence" value={profile.reference || "Non renseignée"} />
          <InfoRow label="Téléphone" value={profile.phoneNumber || "Non renseigné"} />
          <InfoRow label="Prénom" value={profile.firstName || "Non renseigné"} />
          <InfoRow label="Nom" value={profile.lastName || "Non renseigné"} />
          <InfoRow label="Créé le" value={formatDate(profile.dateJoined)} />
          <InfoRow label="Mis à jour le" value={formatDate(profile.updatedAt)} />
        </div>
      </section>

      <aside className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Session</p>
        <h2 className="mt-2 text-xl font-bold text-app-text">Compte connecté</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          Ces informations proviennent de votre profil authentifié.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <LinkButton href="/app/select-pharmacy" variant="secondary">
            Mes pharmacies
          </LinkButton>
          {pharmacyId && (
            <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"}>
              Dashboard
            </LinkButton>
          )}
        </div>
      </aside>
    </div>
  );
}

function ErrorState({ message, pharmacyId }: { message: string; pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Erreur de chargement</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Profil indisponible</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {pharmacyId && (
          <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary">
            Retour au dashboard
          </LinkButton>
        )}
        <LinkButton href="/" variant="secondary">
          Retour à l'accueil
        </LinkButton>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value}</p>
    </div>
  );
}

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
