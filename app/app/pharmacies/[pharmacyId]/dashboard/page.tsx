"use client";

import { useEffect, useState } from "react";
import { PharmacyDashboard } from "@/components/dashboard/pharmacy-dashboard";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { setActivePharmacyId } from "@/lib/auth";
import { getPharmacyDashboard } from "@/lib/dashboard-api";
import type { PharmacyDashboardData } from "@/lib/dashboard";

type DashboardPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "empty" | "ready";

export default function PharmacyDashboardPage({ params }: DashboardPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [dashboardData, setDashboardData] = useState<PharmacyDashboardData | null>(null);
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

    async function loadDashboard() {
      setState("loading");
      setErrorMessage("");

      try {
        const data = await getPharmacyDashboard(pharmacyId);
        setActivePharmacyId(data.pharmacy.id);
        setDashboardData(data);
        setState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.toLowerCase().includes("introuvable")) {
          setState("empty");
          return;
        }

        setErrorMessage(message || "Impossible de charger le dashboard.");
        setState("error");
      }
    }

    loadDashboard();
  }, [pharmacyId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-background text-app-text lg:min-h-[calc(100vh-4.5rem)]">
      {state === "loading" && <DashboardPlaceholder />}
      {state === "error" && <DashboardPlaceholder message={errorMessage} tone="error" />}
      {state === "empty" && <DashboardPlaceholder tone="empty" />}
      {state === "ready" && dashboardData && <PharmacyDashboard data={dashboardData} />}
    </div>
  );
}

function DashboardPlaceholder({
  message,
  tone = "loading",
}: {
  message?: string;
  tone?: "loading" | "error" | "empty";
}) {
  return (
    <>
      <header className="relative z-0 border-b border-app-border bg-app-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary-700">Tableau de bord</p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">Dashboard pharmacie</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
            Chargement de l'aperçu, des ventes et des alertes importantes.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {tone === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement du dashboard" className="min-h-[220px]" />
          </section>
        )}
        {tone === "error" && (
          <Panel tone="error">
            <p className="text-sm font-semibold text-red-600">Erreur</p>
            <h2 className="mt-2 text-2xl font-bold text-app-text">Dashboard indisponible</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
            <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-5">
              Retour
            </LinkButton>
          </Panel>
        )}
        {tone === "empty" && (
          <Panel>
            <p className="text-sm font-semibold text-primary-700">Aucune donnée</p>
            <h2 className="mt-2 text-2xl font-bold text-app-text">Pharmacie introuvable</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              Cette pharmacie est introuvable ou n'est plus accessible avec votre compte.
            </p>
            <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-5">
              Retour
            </LinkButton>
          </Panel>
        )}
      </main>
    </>
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
