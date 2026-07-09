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
    <>
      {state === "loading" && <LoadingDashboard />}
      {state === "error" && <ErrorDashboard message={errorMessage} />}
      {state === "empty" && <EmptyDashboard />}
      {state === "ready" && dashboardData && <PharmacyDashboard data={dashboardData} />}
    </>
  );
}

function LoadingDashboard() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <LoadingBubble label="Chargement du dashboard" className="min-h-0" />
    </section>
  );
}

function ErrorDashboard({ message }: { message: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Panel tone="error">
        <p className="text-sm font-semibold text-red-600">Erreur</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">Dashboard indisponible</h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
        <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-5">
          Retour
        </LinkButton>
      </Panel>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Panel>
        <p className="text-sm font-semibold text-primary-700">Aucune donnée</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">Pharmacie introuvable</h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          Cette pharmacie est introuvable ou n'est plus accessible avec votre compte.
        </p>
        <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-5">
          Retour
        </LinkButton>
      </Panel>
    </section>
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
