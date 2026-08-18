// Statistiques et graphiques du pipeline IA (section 6 du cahier des charges).
//
// Toutes les séries et répartitions proviennent de GET /api/admin/ai/statistics/
// (admin seul). Les graphiques sont dessinés en SVG natif (components/charts).

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAiStatistics,
  type AiStatistics,
  type AiSeriesPoint,
} from "@/lib/api/admin-ai";
import { AdminAiNav } from "@/components/admin/ai/AdminAiNav";
import { PageHeader, SectionCard } from "@/components/admin/ai/widgets";
import {
  BarChart,
  DonutChart,
  LineChart,
  chartPalette,
  type ChartDatum,
} from "@/components/admin/ai/charts";
import { formatMs, formatTokens, formatUsd } from "@/components/admin/ai/widgets";

type PageState = "loading" | "ready" | "error";

// Raccourcit une date "AAAA-MM-JJ" en "MM-JJ" pour les axes.
function shortDate(date: string): string {
  return date.length > 5 ? date.slice(5) : date;
}

function toDatums(points: AiSeriesPoint[], key: "analyses" | "tokens" | "cost_usd"): ChartDatum[] {
  return points.map((point) => ({
    label: shortDate(point.date),
    value: (point[key] ?? 0) as number,
  }));
}

function recordToDonut(record: Record<string, number>): { label: string; value: number; color: string }[] {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .map(([label, value], index) => ({
      label,
      value,
      color: chartPalette[index % chartPalette.length],
    }));
}

export default function AdminAiStatisticsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [stats, setStats] = useState<AiStatistics | null>(null);
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const result = await getAiStatistics();
        if (!isCurrent) {
          return;
        }
        setStats(result);
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
        title="Statistiques du pipeline IA"
        description="Graphiques de volume, durées, coûts, tokens et répartition des erreurs et modèles."
      />
      <AdminAiNav />

      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement des statistiques" className="min-h-[260px]" />
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

      {state === "ready" && stats ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard title="Analyses par jour">
            <BarChart data={toDatums(stats.analyses_per_day, "analyses")} />
          </SectionCard>

          <SectionCard title="Temps moyen par étape (ms)">
            <BarChart
              data={[
                { label: "OpenCV", value: stats.avg_durations.opencv ?? 0 },
                { label: "Vision", value: stats.avg_durations.vision ?? 0 },
                { label: "Gemini", value: stats.avg_durations.gemini ?? 0 },
                { label: "Global", value: stats.avg_durations.global ?? 0 },
              ]}
              formatValue={formatMs}
            />
          </SectionCard>

          <SectionCard title="Coût quotidien (USD)">
            <BarChart
              data={toDatums(stats.cost_per_day, "cost_usd")}
              color="#10B981"
              formatValue={formatUsd}
            />
          </SectionCard>

          <SectionCard title="Évolution des coûts (USD)">
            <LineChart
              series={[
                {
                  name: "Coût",
                  color: "#10B981",
                  data: toDatums(stats.cost_per_day, "cost_usd"),
                },
              ]}
              formatValue={formatUsd}
            />
          </SectionCard>

          <SectionCard title="Consommation de tokens par jour">
            <LineChart
              series={[
                {
                  name: "Tokens",
                  color: "#06B6D4",
                  data: toDatums(stats.token_consumption_per_day, "tokens"),
                },
              ]}
              formatValue={formatTokens}
            />
          </SectionCard>

          <SectionCard title="Répartition des erreurs">
            <DonutChart data={recordToDonut(stats.error_repartition)} />
          </SectionCard>

          <SectionCard title="Répartition des modèles IA">
            <DonutChart data={recordToDonut(stats.model_repartition)} />
          </SectionCard>

          <SectionCard title="Répartition Vision / Gemini (tokens)">
            <DonutChart
              data={[
                { label: "Vision", value: stats.vision_gemini_split.vision_tokens, color: "#1a4b80" },
                {
                  label: "Gemini",
                  value: stats.vision_gemini_split.gemini_tokens,
                  color: "#E8C020",
                },
              ]}
            />
          </SectionCard>

          {Object.keys(stats.business_codes).length ? (
            <SectionCard title="Codes d'erreur métier">
              <DonutChart data={recordToDonut(stats.business_codes)} />
            </SectionCard>
          ) : null}

          {Object.keys(stats.technical_codes).length ? (
            <SectionCard title="Codes d'erreur technique">
              <DonutChart data={recordToDonut(stats.technical_codes)} />
            </SectionCard>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
