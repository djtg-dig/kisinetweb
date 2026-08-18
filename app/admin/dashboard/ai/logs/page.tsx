// Consultation sécurisée du journal prescription_ai.log (section 8).
//
// Recherche, filtres (niveau, date, error_id, événement) et pagination. Aucun
// accès arbitraire au système de fichiers : seuls les fichiers de journal Kisinet
// sont lus par le backend (endpoint /api/admin/ai/logs/, admin seul).

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAiLogs,
  type AiLogFilters,
  type AiLogPage,
  type AiLogRecord,
} from "@/lib/api/admin-ai";
import { AdminAiNav } from "@/components/admin/ai/AdminAiNav";
import { PageHeader, SectionCard } from "@/components/admin/ai/widgets";

type PageState = "loading" | "ready" | "error";

const emptyFilters: AiLogFilters = {};

export default function AdminAiLogsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<AiLogPage | null>(null);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<"" | "INFO" | "WARNING" | "ERROR">("");
  const [date, setDate] = useState("");
  const [errorId, setErrorId] = useState("");
  const [event, setEvent] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AiLogFilters>(emptyFilters);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const result = await getAiLogs({ filters: appliedFilters, page });
        if (!isCurrent) {
          return;
        }
        setData(result);
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
  }, [appliedFilters, page, refreshIndex]);

  function applyFilters() {
    const filters: AiLogFilters = {};
    if (search.trim()) filters.search = search.trim();
    if (level) filters.level = level;
    if (date.trim()) filters.date = date.trim();
    if (errorId.trim()) filters.error_id = errorId.trim();
    if (event.trim()) filters.event = event.trim();
    setPage(1);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setSearch("");
    setLevel("");
    setDate("");
    setErrorId("");
    setEvent("");
    setPage(1);
    setAppliedFilters(emptyFilters);
  }

  const count = data?.count ?? 0;
  const pageSize = data?.page_size ?? 50;
  const hasNext = page * pageSize < count;
  const hasPrevious = page > 1;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Journal prescription_ai.log"
        description="Consultation sécurisée du journal d'analyse IA (recherche, niveau, date, error_id, événement). Aucun accès au système de fichiers."
      />
      <AdminAiNav />

      <SectionCard title="Filtres">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-app-muted">Recherche libre</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="message ou contenu"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-app-muted">Niveau</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as typeof level)}
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            >
              <option value="">Tous</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-app-muted">Date (AAAA-MM-JJ)</span>
            <input
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-app-muted">Error ID</span>
            <input
              value={errorId}
              onChange={(event) => setErrorId(event.target.value)}
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-app-muted">Événement</span>
            <input
              value={event}
              onChange={(event) => setEvent(event.target.value)}
              placeholder="ex. analysis_completed"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={applyFilters}>
            Appliquer
          </Button>
          <Button type="button" variant="secondary" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      </SectionCard>

      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement des logs" className="min-h-[260px]" />
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

      {state === "ready" && data ? (
        <SectionCard>
          <div className="space-y-2">
            {data.results.map((record, index) => (
              <LogRow key={`${record.timestamp}-${index}`} record={record} />
            ))}
          </div>

          {!data.results.length ? (
            <p className="px-4 py-6 text-sm text-app-muted">Aucun journal ne correspond.</p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-app-muted">
              Page {page} · {pageSize} lignes maximum · {count} résultat{count > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!hasPrevious}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!hasNext}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </section>
  );
}

const levelClasses: Record<string, string> = {
  INFO: "bg-app-surface text-app-muted",
  WARNING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  ERROR: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function LogRow({ record }: { record: AiLogRecord }) {
  const eventName =
    (record.prescription_ai && (record.prescription_ai.event as string)) || null;
  return (
    <details className="rounded-md border border-app-border bg-app-surface">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
            levelClasses[record.level] ?? "bg-app-surface text-app-muted"
          }`}
        >
          {record.level}
        </span>
        <span className="font-mono text-[11px] text-app-muted">{record.timestamp}</span>
        {eventName ? (
          <span className="rounded bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
            {eventName}
          </span>
        ) : null}
        <span className="text-app-text">{record.message}</span>
      </summary>
      <div className="space-y-2 border-t border-app-border p-3">
        {record.prescription_ai ? (
          <pre className="max-h-72 overflow-auto rounded-md border border-app-border bg-app-card p-3 text-xs text-app-text">
            {JSON.stringify(record.prescription_ai, null, 2)}
          </pre>
        ) : null}
        {record.exception ? (
          <pre className="max-h-72 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950 dark:text-red-200">
            {record.exception}
          </pre>
        ) : null}
      </div>
    </details>
  );
}
