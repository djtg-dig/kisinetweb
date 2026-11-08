"use client";

import { useEffect, useState } from "react";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getPharmacyAiCredits, type PharmacyAiCredits } from "@/lib/api/billing";

type AiSettingsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "ready" | "error";

export default function PharmacyAiSettingsPage({ params }: AiSettingsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [credits, setCredits] = useState<PharmacyAiCredits | null>(null);

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

    let isCurrent = true;

    async function loadCredits() {
      setState("loading");
      setErrorMessage("");

      try {
        const data = await getPharmacyAiCredits(pharmacyId);
        if (!isCurrent) {
          return;
        }
        setCredits(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les informations IA de la pharmacie.",
        );
        setState("error");
      }
    }

    loadCredits();

    return () => {
      isCurrent = false;
    };
  }, [pharmacyId]);

  const basePath = "/app/pharmacies/" + pharmacyId;

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">Paramètres</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Informations sur l’IA</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
              Consultez les crédits d’analyse IA de la pharmacie, la période en cours et la
              consommation.
            </p>
          </div>
          <a
            href={pharmacyId ? basePath + "/settings" : "#"}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            Retour
          </a>
        </div>
      </section>

      {errorMessage && (
        <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">Impossible de charger les informations</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      )}

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8">
          <LoadingBubble label="Chargement des informations IA" className="min-h-[180px]" />
        </section>
      )}

      {state === "ready" && credits && (
        <section className="mt-6 grid gap-4">
          <article className="rounded-lg border border-app-border bg-app-card p-5">
            <h2 className="text-lg font-bold text-app-text">Crédits d’analyse IA</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Référence pharmacie" value={credits.pharmacyReference} />
              <Detail label="Plan" value={credits.planName || credits.planCode} />
              <Detail
                label="Période"
                value={formatPeriod(credits.periodStart, credits.periodEnd)}
              />
              <Detail label="Utilisateurs facturables" value={credits.billableUsers} />
              <Detail
                label="Crédits inclus"
                value={credits.included.toLocaleString("fr-FR")}
              />
              <Detail label="Crédits utilisés" value={credits.used.toLocaleString("fr-FR")} />
              <Detail
                label="Crédits restants"
                value={credits.remaining.toLocaleString("fr-FR")}
                strong
              />
              <Detail label="Taux d’utilisation" value={credits.usagePercent + " %"} />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-app-muted">
                <span>Consommation de la période</span>
                <span>{credits.usagePercent} %</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-app-surface">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: Math.min(100, credits.usagePercent) + "%" }}
                />
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-app-border bg-app-card p-5">
            <h2 className="text-lg font-bold text-app-text">À savoir</h2>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              Les crédits d’analyse IA sont partagés par la pharmacie pour la période en cours. Ils
              sont consommés à chaque analyse d’ordonnance (scanner avec l’IA) par un membre de la
              pharmacie. Vérifiez toujours les résultats proposés par l’IA avant validation.
            </p>
          </article>
        </section>
      )}
    </main>
  );
}

function Detail({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: string | number | null;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</p>
      <p
        className={
          "mt-1 text-sm " +
          (strong ? "font-bold text-primary-700" : "font-semibold text-app-text")
        }
      >
        {value !== undefined && value !== null && String(value).trim() ? value : "—"}
      </p>
    </div>
  );
}

function formatPeriod(start?: string, end?: string) {
  const formattedStart = start ? formatDate(start) : "—";
  const formattedEnd = end ? formatDate(end) : "—";

  return formattedStart + " → " + formattedEnd;
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}
