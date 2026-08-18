// Page « Erreurs » du tableau de bord IA.
//
// Agrégats des erreurs (métier/technique, codes) et liste filtrée des analyses
// en erreur. Données réservées aux administrateurs.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAiAnalyses,
  getAiDashboard,
  getAiStatistics,
  type AiAnalysis,
  type AiDashboard,
  type AiStatistics,
} from "@/lib/api/admin-ai";
import { AdminAiNav } from "@/components/admin/ai/AdminAiNav";
import {
  ErrorKindBadge,
  PageHeader,
  SectionCard,
  StatCard,
  StatGrid,
  formatInt,
  formatPct,
} from "@/components/admin/ai/widgets";
import { DonutChart, chartPalette } from "@/components/admin/ai/charts";

type PageState = "loading" | "ready" | "error";

function recordToDonut(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .map(([label, value], index) => ({
      label,
      value,
      color: chartPalette[index % chartPalette.length],
    }));
}

export default function AdminAiErrorsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [dashboard, setDashboard] = useState<AiDashboard | null>(null);
  const [stats, setStats] = useState<AiStatistics | null>(null);
  const [errors, setErrors] = useState<AiAnalysis[]>([]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const [dash, stat, errorPage] = await Promise.all([
          getAiDashboard(),
          getAiStatistics(),
          getAiAnalyses({ filters: { status: "error" }, pageSize: 50 }),
        ]);
        if (!isCurrent) {
          return;
        }
        setDashboard(dash);
        setStats(stat);
        setErrors(errorPage.results);
        setCount(errorPage.count);
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
        title="Erreurs du pipeline IA"
        description="Répartition des erreurs métier et techniques, codes d'erreur et liste des analyses en échec."
      />
      <AdminAiNav />

      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement des erreurs" className="min-h-[260px]" />
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
          <SectionCard title="Synthèse">
            <StatGrid>
              <StatCard label="Erreurs métier" value={formatInt(dashboard.errors.business)} tone="warning" />
              <StatCard label="Erreurs techniques" value={formatInt(dashboard.errors.technical)} tone="error" />
              <StatCard
                label="Total erreurs"
                value={formatInt(dashboard.errors.business + dashboard.errors.technical)}
                tone="error"
              />
              <StatCard label="Taux d'échec" value={formatPct(dashboard.rates.failure)} tone="error" />
            </StatGrid>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard title="Répartition des erreurs">
              <DonutChart data={recordToDonut(stats.error_repartition)} />
            </SectionCard>
            <SectionCard title="Codes métier">
              <DonutChart data={recordToDonut(stats.business_codes)} />
            </SectionCard>
            <SectionCard title="Codes techniques">
              <DonutChart data={recordToDonut(stats.technical_codes)} />
            </SectionCard>
          </div>

          <SectionCard title={`Analyses en erreur (${count})`}>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] divide-y divide-app-border text-left text-xs">
                <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Pharmacie</th>
                    <th className="px-3 py-3">Utilisateur</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Error ID</th>
                    <th className="px-3 py-3">Message</th>
                    <th className="px-3 py-3">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {errors.map((analysis) => (
                    <tr key={analysis.analysis_id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-app-muted">
                        {analysis.date ?? "—"}
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-app-text">
                        {analysis.pharmacy ?? "—"}
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-app-text">
                        {analysis.user ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <ErrorKindBadge category={analysis.category} />
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3 font-mono text-[11px] text-app-muted">
                        {analysis.business_code ?? analysis.technical_code ?? "—"}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3 font-mono text-[11px] text-app-muted">
                        {analysis.error_id ?? "—"}
                      </td>
                      <td className="max-w-[320px] truncate px-3 py-3 text-app-muted">
                        {analysis.error_message ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/dashboard/ai/analyses/${encodeURIComponent(analysis.analysis_id)}`}
                          className="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-primary-700"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!errors.length ? (
              <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
                Aucune erreur enregistrée.
              </p>
            ) : null}
          </SectionCard>
        </>
      ) : null}
    </section>
  );
}
