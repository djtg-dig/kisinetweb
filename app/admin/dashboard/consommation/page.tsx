// Page « Consommation » du tableau de bord IA (section consommation).
//
// Consommation de tokens et coûts par fournisseur (Google Vision, Gemini) et
// total IA, évolution quotidienne et répartition par modèle. Admin seul.

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAiDashboard,
  getAiStatistics,
  type AiDashboard,
  type AiStatistics,
} from "@/lib/api/admin-ai";
import { AdminAiNav } from "@/components/admin/ai/AdminAiNav";
import {
  PageHeader,
  SectionCard,
  StatCard,
  StatGrid,
  formatTokens,
  formatUsd,
} from "@/components/admin/ai/widgets";
import { BarChart, DonutChart, LineChart, chartPalette } from "@/components/admin/ai/charts";

type PageState = "loading" | "ready" | "error";

function shortDate(date: string): string {
  return date.length > 5 ? date.slice(5) : date;
}

export default function AdminAiConsumptionPage() {
  const [state, setState] = useState<PageState>("loading");
  const [dashboard, setDashboard] = useState<AiDashboard | null>(null);
  const [stats, setStats] = useState<AiStatistics | null>(null);
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const [dash, stat] = await Promise.all([getAiDashboard(), getAiStatistics()]);
        if (!isCurrent) {
          return;
        }
        setDashboard(dash);
        setStats(stat);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Chargement impossible.");
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
        title="Consommation IA"
        description="Tokens et coûts consommés par Google Vision et Gemini, évolution quotidienne et répartition par modèle."
      />
      <AdminAiNav />

      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement de la consommation" className="min-h-[260px]" />
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

      {state === "ready" && dashboard && stats ? (
        <>
          <SectionCard title="Consommation par fournisseur">
            <StatGrid>
              <StatCard label="Tokens Vision" value={formatTokens(dashboard.consumption.vision_tokens)} />
              <StatCard label="Coût Vision" value={formatUsd(dashboard.consumption.vision_cost_usd)} />
              <StatCard label="Tokens Gemini" value={formatTokens(dashboard.consumption.gemini_tokens)} />
              <StatCard label="Coût Gemini" value={formatUsd(dashboard.consumption.gemini_cost_usd)} />
              <StatCard label="Tokens IA total" value={formatTokens(dashboard.consumption.ia_tokens)} tone="info" />
              <StatCard label="Coût IA total" value={formatUsd(dashboard.consumption.ia_cost_usd)} tone="info" />
            </StatGrid>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="Répartition Vision / Gemini (tokens)">
              <DonutChart
                data={[
                  { label: "Vision", value: stats.vision_gemini_split.vision_tokens, color: "#1a4b80" },
                  { label: "Gemini", value: stats.vision_gemini_split.gemini_tokens, color: "#E8C020" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Répartition par modèle IA">
              <DonutChart
                data={Object.entries(stats.model_repartition)
                  .filter(([, value]) => value > 0)
                  .map(([label, value], index) => ({
                    label,
                    value,
                    color: chartPalette[index % chartPalette.length],
                  }))}
              />
            </SectionCard>

            <SectionCard title="Consommation de tokens par jour">
              <LineChart
                series={[
                  {
                    name: "Tokens",
                    color: "#06B6D4",
                    data: stats.token_consumption_per_day.map((point) => ({
                      label: shortDate(point.date),
                      value: point.tokens ?? 0,
                    })),
                  },
                ]}
                formatValue={formatTokens}
              />
            </SectionCard>

            <SectionCard title="Tokens par jour (barres)">
              <BarChart
                data={stats.token_consumption_per_day.map((point) => ({
                  label: shortDate(point.date),
                  value: point.tokens ?? 0,
                }))}
                color="#06B6D4"
                formatValue={formatTokens}
              />
            </SectionCard>
          </div>
        </>
      ) : null}
    </section>
  );
}
