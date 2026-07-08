"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getUserPharmacies, type PharmacySummary } from "@/lib/api";
import { saveTokensFromUrlHash, setActivePharmacyId } from "@/lib/auth";

type PageState = "loading" | "error" | "empty" | "ready" | "redirecting";

export default function SelectPharmacyPage() {
  const [state, setState] = useState<PageState>("loading");
  const [pharmacies, setPharmacies] = useState<PharmacySummary[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPharmacies() {
      try {
        saveTokensFromUrlHash();

        const userPharmacies = await getUserPharmacies();
        setPharmacies(userPharmacies);
        setState(userPharmacies.length === 0 ? "empty" : "ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Une erreur inconnue est survenue.");
        setState("error");
      }
    }

    loadPharmacies();
  }, []);

  function openPharmacy(pharmacyId: string) {
    setActivePharmacyId(pharmacyId);
    setState("redirecting");
    window.location.href = "/app/pharmacies/" + pharmacyId + "/dashboard";
  }

  return (
    <MainLayout>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-700">Espace de travail</p>
              <h1 className="mt-2 text-3xl font-bold text-app-text">Mes pharmacies</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
                Sélectionnez une pharmacie associée à votre compte pour accéder à son
                tableau de bord.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/app/pharmacies/create">Créer une pharmacie</LinkButton>
              <LinkButton href="/app/pharmacies/join" variant="secondary">
                Rejoindre une pharmacie
              </LinkButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryTile label="Pharmacies accessibles" value={String(pharmacies.length)} />
            <SummaryTile label="Session" value={state === "error" ? "À vérifier" : "Connectée"} />
          </div>
        </div>
      </section>

      <section className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && <LoadingState />}
        {state === "redirecting" && <RedirectingState />}
        {state === "error" && <ErrorState message={errorMessage} />}
        {state === "empty" && <EmptyState />}
        {state === "ready" && (
          <PharmacyList pharmacies={pharmacies} onOpenPharmacy={openPharmacy} />
        )}
      </section>
    </MainLayout>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card px-4 py-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-app-text">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <Panel>
      <p className="text-sm font-semibold text-primary-700">Chargement</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Récupération des pharmacies</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Kisinet interroge le backend pour afficher les pharmacies liées à votre session.
      </p>
    </Panel>
  );
}

function RedirectingState() {
  return <LoadingBubble label="Ouverture de la pharmacie" />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <Panel tone="error">
      <p className="text-sm font-semibold text-red-600">Erreur de chargement</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Impossible de charger vos pharmacies</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton href="/" variant="secondary" className="mt-5">
        Retour à l’accueil
      </LinkButton>
    </Panel>
  );
}

function EmptyState() {
  return (
    <Panel>
      <p className="text-sm font-semibold text-primary-700">Aucune pharmacie</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Aucune pharmacie trouvée</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Votre compte n’est associé à aucune pharmacie pour le moment.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/app/pharmacies/create">Créer une pharmacie</LinkButton>
        <LinkButton href="/app/pharmacies/join" variant="secondary">
          Rejoindre une pharmacie
        </LinkButton>
      </div>
    </Panel>
  );
}

function PharmacyList({
  pharmacies,
  onOpenPharmacy,
}: {
  pharmacies: PharmacySummary[];
  onOpenPharmacy: (pharmacyId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pharmacies.map((pharmacy) => (
        <article
          key={pharmacy.id}
          className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm transition hover:border-primary-200 hover:shadow-soft"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-app-text">{pharmacy.name}</h2>
                {pharmacy.subscriptionStatus && (
                  <StatusBadge status={pharmacy.subscriptionStatus} />
                )}
              </div>
              {pharmacy.reference && (
                <p className="mt-1 text-xs font-semibold text-app-muted">
                  Référence {pharmacy.reference}
                </p>
              )}
            </div>
            <Button onClick={() => onOpenPharmacy(pharmacy.id)} className="shrink-0">
              Ouvrir
            </Button>
          </div>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Abonnement" value={pharmacy.planName || "Non renseigné"} />
            <InfoRow label="Fin d’essai" value={formatDate(pharmacy.trialEndsAt)} />
            <InfoRow label="Email" value={pharmacy.email || "Non renseigné"} />
            <InfoRow label="Téléphone" value={pharmacy.phoneNumber || "Non renseigné"} />
          </div>

          <div className="mt-4 border-t border-app-border pt-4">
            <p className="text-xs font-semibold text-app-muted">Adresse</p>
            <p className="mt-1 text-sm text-app-text">
              {pharmacy.addressLine || "Adresse non renseignée"}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 truncate font-medium text-app-text">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const isPositive = normalizedStatus === "active" || normalizedStatus === "trialing";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        isPositive
          ? "bg-success-50 text-success-700 ring-success-100"
          : "bg-primary-50 text-primary-700 ring-primary-100"
      }`}
    >
      {status}
    </span>
  );
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

function Panel({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`max-w-2xl rounded-lg border bg-app-card p-6 shadow-sm ${
        tone === "error" ? "border-red-200" : "border-app-border"
      }`}
    >
      {children}
    </div>
  );
}
