// Page « Coûts » du tableau de bord IA (section coûts).
//
// Coût total estimé et coûts par période (aujourd'hui / semaine / mois), avec
// l'évolution quotidienne. Admin seul.

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
import { BarChart, LineChart } from "@/components/admin/ai/charts";

type PageState = "loading" | "ready" | "error";

function shortDate(date: string): string {
  return date.length > 5 ? date.slice(5) : date;
}

export default function AdminAiCostsPage() {
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
        title="Coûts du pipeline IA"
        description="Coût total estimé et coûts par période (aujourd'hui, cette semaine, ce mois), avec l'évolution quotidienne."
      />
      <AdminAiNav />
      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement des coûts" className="min-h-[260px]" />
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
          <SectionCard title="Coûts par période">
            <StatGrid>
              <StatCard label="Coût total estimé" value={formatUsd(dashboard.cost_total_usd)} tone="info" />
              <StatCard label="Coût aujourd'hui" value={formatUsd(dashboard.cost_today_usd)} />
              <StatCard label="Coût cette semaine" value={formatUsd(dashboard.cost_week_usd)} />
              <StatCard label="Coût ce mois" value={formatUsd(dashboard.cost_month_usd)} />
              <StatCard label="Tokens totaux" value={formatTokens(dashboard.tokens_total)} />
            </StatGrid>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="Évolution des coûts (USD)">
              <LineChart
                series={[
                  {
                    name: "Coût",
                    color: "#10B981",
                    data: stats.cost_per_day.map((point) => ({
                      label: shortDate(point.date),
                      value: point.cost_usd ?? 0,
                    })),
                  },
                ]}
                formatValue={formatUsd}
              />
            </SectionCard>

            <SectionCard title="Coût quotidien (USD)">
              <BarChart
                data={stats.cost_per_day.map((point) => ({
                  label: shortDate(point.date),
                  value: point.cost_usd ?? 0,
                }))}
                color="#10B981"
                formatValue={formatUsd}
              />
            </SectionCard>
          </div>

          <SectionCard title="Détail quotidien (30 derniers jours)">
            <div className="overflow-x-auto">
              <table className="min-w-[520px] divide-y divide-app-border text-left text-xs">
                <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Tokens</th>
                    <th className="px-3 py-2">Coût (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {stats.cost_per_day.map((point) => (
                    <tr key={point.date}>
                      <td className="px-3 py-2 text-app-muted">{point.date}</td>
                      <td className="px-3 py-2 font-mono text-app-muted">
                        {formatTokens(point.tokens ?? 0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-app-text">
                        {formatUsd(point.cost_usd ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      ) : null}
    </section>
  );
}
