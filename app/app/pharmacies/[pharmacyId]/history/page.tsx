"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getPharmacyActivity,
  getPharmacyDetail,
  type PharmacyActivity,
  type PharmacyDetail,
} from "@/lib/api";

type HistoryPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "empty" | "ready";

export default function PharmacyHistoryPage({ params }: HistoryPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [activity, setActivity] = useState<PharmacyActivity[]>([]);
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

    async function loadHistory() {
      setState("loading");
      setErrorMessage("");

      try {
        const [pharmacyData, activityData] = await Promise.all([
          getPharmacyDetail(pharmacyId),
          getPharmacyActivity(pharmacyId),
        ]);

        setPharmacy(pharmacyData);
        setActivity(activityData);
        setState(activityData.length ? "ready" : "empty");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger l'historique.");
        setState("error");
      }
    }

    loadHistory();
  }, [pharmacyId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-background text-app-text lg:min-h-[calc(100vh-4.5rem)]">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Compte</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Mon historique</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Activité récente liée à {pharmacy?.name || "la pharmacie active"}.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement de l'historique" className="min-h-[220px]" />
          </section>
        )}
        {state === "error" && <ErrorState message={errorMessage} pharmacyId={pharmacyId} />}
        {state === "empty" && <EmptyState pharmacyId={pharmacyId} />}
        {state === "ready" && <ActivityList activity={activity} pharmacyId={pharmacyId} />}
      </main>
    </div>
  );
}

function ActivityList({
  activity,
  pharmacyId,
}: {
  activity: PharmacyActivity[];
  pharmacyId: string;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-app-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-700">Pharmacie active</p>
          <h2 className="mt-1 text-xl font-bold text-app-text">Activité récente</h2>
        </div>
        <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary">
          Dashboard
        </LinkButton>
      </div>

      <div className="mt-6 grid gap-4">
        {activity.map((item) => (
          <article key={item.id} className="border-l-2 border-primary-600 pl-4">
            <p className="text-xs font-semibold text-app-muted">{formatDateTime(item.createdAt)}</p>
            <h3 className="mt-1 text-sm font-bold text-app-text">{item.label}</h3>
            <p className="mt-1 text-sm leading-6 text-app-muted">
              {item.user ? item.message + " par " + item.user : item.message}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ErrorState({ message, pharmacyId }: { message: string; pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Erreur de chargement</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Historique indisponible</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary" className="mt-5">
        Retour au dashboard
      </LinkButton>
    </section>
  );
}

function EmptyState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Aucune activité</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Historique vide</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Aucune activité récente n'est encore disponible pour cette pharmacie.
      </p>
      <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary" className="mt-5">
        Retour au dashboard
      </LinkButton>
    </section>
  );
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Date non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
