"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";
import { getUserPharmacies, type PharmacySummary } from "@/lib/api";
import { LAST_PHARMACY_KEY } from "@/lib/auth";

type DashboardPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "ready";

export default function PharmacyDashboardPage({ params }: DashboardPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacy, setPharmacy] = useState<PharmacySummary | null>(null);
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
    if (!pharmacyId) {
      return;
    }

    async function loadPharmacy() {
      setState("loading");
      setErrorMessage("");

      try {
        const pharmacies = await getUserPharmacies();
        const selectedPharmacy = pharmacies.find(
          (item) => item.id === pharmacyId || item.reference === pharmacyId,
        );

        if (!selectedPharmacy) {
          throw new Error("Cette pharmacie est introuvable ou n'est plus accessible.");
        }

        localStorage.setItem(LAST_PHARMACY_KEY, selectedPharmacy.id);
        setPharmacy(selectedPharmacy);
        setState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger cette pharmacie.");
        setState("error");
      }
    }

    loadPharmacy();
  }, [pharmacyId]);

  return (
    <MainLayout>
      {state === "loading" && <LoadingDashboard />}
      {state === "error" && <ErrorDashboard message={errorMessage} />}
      {state === "ready" && pharmacy && <Dashboard pharmacy={pharmacy} />}
    </MainLayout>
  );
}

function Dashboard({ pharmacy }: { pharmacy: PharmacySummary }) {
  return (
    <>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary-700">Tableau de bord</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">{pharmacy.name}</h1>
              <p className="mt-3 text-sm leading-6 text-app-muted">
                Référence {pharmacy.reference || pharmacy.id}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/app/select-pharmacy" variant="secondary">
                Changer de pharmacie
              </LinkButton>
              <LinkButton href="/app/pharmacies/create">Créer une pharmacie</LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="Abonnement" value={pharmacy.planName || "Basic"} />
            <SummaryCard
              label="Statut"
              value={pharmacy.subscriptionStatus || pharmacy.status || "Actif"}
            />
            <SummaryCard label="Fin d'essai" value={formatDate(pharmacy.trialEndsAt)} />
          </div>

          <div className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
            <h2 className="text-lg font-bold text-app-text">Activité</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ActionCard title="Stocks" description="Suivre les produits et les niveaux disponibles." />
              <ActionCard title="Ventes" description="Consulter les opérations et les recettes." />
              <ActionCard title="Factures" description="Préparer et retrouver les documents clients." />
              <ActionCard title="Équipe" description="Gérer les accès et les rôles des membres." />
            </div>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
            <h2 className="text-lg font-bold text-app-text">Informations</h2>
            <div className="mt-4 grid gap-4">
              <InfoRow label="Email" value={pharmacy.email || "Non renseigné"} />
              <InfoRow label="Téléphone" value={pharmacy.phoneNumber || "Non renseigné"} />
              <InfoRow label="Adresse" value={pharmacy.addressLine || "Non renseignée"} />
            </div>
          </div>

          <div className="rounded-lg border border-app-border bg-app-surface p-5">
            <p className="text-sm font-semibold text-primary-700">Prochaine étape</p>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              Les modules de gestion peuvent maintenant être reliés à cette pharmacie.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}

function LoadingDashboard() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Panel>
        <p className="text-sm font-semibold text-primary-700">Chargement</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">Ouverture du tableau de bord</h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          Kisinet récupère les informations de la pharmacie.
        </p>
      </Panel>
    </section>
  );
}

function ErrorDashboard({ message }: { message: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Panel tone="error">
        <p className="text-sm font-semibold text-red-600">Erreur</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">Tableau de bord indisponible</h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
        <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-5">
          Retour aux pharmacies
        </LinkButton>
      </Panel>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-app-text">{value}</p>
    </div>
  );
}

function ActionCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-4">
      <h3 className="font-semibold text-app-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-app-muted">{description}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-app-text">{value}</p>
    </div>
  );
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
