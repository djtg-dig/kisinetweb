// Vue générale du tableau de bord IA (section 2 + alertes section 7).
//
// Page d'accueil de la section « IA » accessible à /admin/dashboard. Toutes les
// données proviennent de GET /api/admin/ai/dashboard/ et /alerts/, réservés aux
// administrateurs. Aucun pharmacien n'y a accès (guard + permission backend).

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAiAlerts,
  getAiDashboard,
  type AiAlert,
  type AiDashboard,
} from "@/lib/api/admin-ai";
import { AdminAiNav } from "@/components/admin/ai/AdminAiNav";
import {
  AlertsList,
  PageHeader,
  SectionCard,
  StatCard,
  StatGrid,
  formatInt,
  formatMs,
  formatPct,
  formatTokens,
  formatUsd,
} from "@/components/admin/ai/widgets";

type PageState = "loading" | "ready" | "error";

export default function AdminAiOverviewPage() {
  const [state, setState] = useState<PageState>("loading");
  const [dashboard, setDashboard] = useState<AiDashboard | null>(null);
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const [dash, alertsResponse] = await Promise.all([
          getAiDashboard(),
          getAiAlerts(),
        ]);
        if (!isCurrent) {
          return;
        }
        setDashboard(dash);
        setAlerts(alertsResponse.alerts);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Chargement impossible.",
        );
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [refreshIndex]);

  return (
    <section className="space-y-4">
      <PageHeader
        title="Vue générale du pipeline IA"
        description="Surveillance temps réel de l'ensemble du pipeline d'analyse d'ordonnance (OpenCV, Google Vision, Gemini). Données réservées aux administrateurs."
      />
      <AdminAiNav />

      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement du tableau de bord IA" className="min-h-[260px]" />
        </SectionCard>
      )}

      {state === "error" && (
        <SectionCard>
          <p className="text-sm font-semibold text-red-700">Chargement impossible</p>
          <p className="mt-2 text-sm text-app-muted">{message}</p>
          <Button onClick={() => setRefreshIndex((value) => value + 1)} className="mt-5">
            Réessayer
          </Button>
        </SectionCard>
      )}

      {state === "ready" && dashboard ? (
        <>
          <AlertsList alerts={alerts} />

          <SectionCard title="Volumes d'analyses">
            <StatGrid>
              <StatCard label="Total analyses" value={formatInt(dashboard.counts.total)} />
              <StatCard label="Aujourd'hui" value={formatInt(dashboard.counts.today)} />
              <StatCard label="Cette semaine" value={formatInt(dashboard.counts.week)} />
              <StatCard label="Ce mois" value={formatInt(dashboard.counts.month)} />
            </StatGrid>
          </SectionCard>

          <SectionCard title="Temps moyens par étape">
            <StatGrid>
              <StatCard label="Global (par ordonnance)" value={formatMs(dashboard.durations_ms.global)} />
              <StatCard label="OpenCV" value={formatMs(dashboard.durations_ms.opencv)} />
              <StatCard label="Google Vision" value={formatMs(dashboard.durations_ms.vision)} />
              <StatCard label="Gemini" value={formatMs(dashboard.durations_ms.gemini)} />
            </StatGrid>
          </SectionCard>

          <SectionCard title="Réussite et erreurs">
            <StatGrid>
              <StatCard label="Taux de réussite" value={formatPct(dashboard.rates.success)} tone="success" />
              <StatCard label="Taux d'échec" value={formatPct(dashboard.rates.failure)} tone="error" />
              <StatCard label="Erreurs métier" value={formatInt(dashboard.errors.business)} tone="warning" />
              <StatCard label="Erreurs techniques" value={formatInt(dashboard.errors.technical)} tone="error" />
            </StatGrid>
          </SectionCard>

          <SectionCard title="Qualité de lecture et médicaments">
            <StatGrid>
              <StatCard
                label="Médicaments détectés (moy.)"
                value={formatInt(dashboard.averages.medications_per_analysis)}
              />
              <StatCard
                label="Lignes OCR (moy.)"
                value={formatInt(dashboard.averages.ocr_lines_per_analysis)}
              />
              <StatCard
                label="Score lecture image"
                value={formatPct(dashboard.scores.image_reading)}
              />
              <StatCard
                label="Score lecture ordonnance"
                value={formatPct(dashboard.scores.prescription_reading)}
              />
            </StatGrid>
          </SectionCard>

          <SectionCard title="Consommation et coûts IA">
            <StatGrid>
              <StatCard label="Tokens totaux" value={formatTokens(dashboard.tokens_total)} />
              <StatCard label="Coût total estimé" value={formatUsd(dashboard.cost_total_usd)} />
              <StatCard label="Coût aujourd'hui" value={formatUsd(dashboard.cost_today_usd)} />
              <StatCard label="Coût cette semaine" value={formatUsd(dashboard.cost_week_usd)} />
              <StatCard label="Coût ce mois" value={formatUsd(dashboard.cost_month_usd)} />
              <StatCard
                label="Tokens Vision"
                value={formatTokens(dashboard.consumption.vision_tokens)}
              />
              <StatCard
                label="Tokens Gemini"
                value={formatTokens(dashboard.consumption.gemini_tokens)}
              />
              <StatCard label="Tokens IA" value={formatTokens(dashboard.consumption.ia_tokens)} />
            </StatGrid>
          </SectionCard>
        </>
      ) : null}
    </section>
  );
}
