// Journal des analyses IA (sections 3 et 5 du cahier des charges).
//
// Liste paginée et filtrable. Chaque ligne renvoie vers le détail complet.
// Toutes les données proviennent de GET /api/admin/ai/analyses/ (admin seul).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAiAnalyses,
  type AiAnalysis,
  type AiAnalysisFilters,
  type AiAnalysisPage,
} from "@/lib/api/admin-ai";
import { AdminAiNav } from "@/components/admin/ai/AdminAiNav";
import {
  ErrorKindBadge,
  PageHeader,
  SectionCard,
  StatusBadge,
  formatInt,
  formatMs,
  formatPct,
  formatTokens,
  formatUsd,
} from "@/components/admin/ai/widgets";

type PageState = "loading" | "ready" | "error";

const emptyFilters: AiAnalysisFilters = {};

export default function AdminAiAnalysesPage() {
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<AiAnalysisPage | null>(null);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  // Filtres contrôlés (section 5).
  const [pharmacy, setPharmacy] = useState("");
  const [user, setUser] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [category, setCategory] = useState<"" | "business" | "technical">("");
  const [errorId, setErrorId] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [minCost, setMinCost] = useState("");
  const [minTime, setMinTime] = useState("");
  const [minOcr, setMinOcr] = useState("");
  const [minVision, setMinVision] = useState("");
  const [minMedications, setMinMedications] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<AiAnalysisFilters>(emptyFilters);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const pageData = await getAiAnalyses({ filters: appliedFilters, page });
        if (!isCurrent) {
          return;
        }
        setData(pageData);
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
    const filters: AiAnalysisFilters = {};
    if (pharmacy.trim()) filters.pharmacy = pharmacy.trim();
    if (user.trim()) filters.user = user.trim();
    if (date.trim()) filters.date = date.trim();
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (errorId.trim()) filters.error_id = errorId.trim();
    if (businessCode.trim()) filters.business_code = businessCode.trim();
    if (minCost.trim()) filters.min_cost = Number(minCost);
    if (minTime.trim()) filters.min_time = Number(minTime);
    if (minOcr.trim()) filters.min_ocr = Number(minOcr);
    if (minVision.trim()) filters.min_vision_score = Number(minVision);
    if (minMedications.trim()) filters.min_medications = Number(minMedications);
    setPage(1);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setPharmacy("");
    setUser("");
    setDate("");
    setStatus("");
    setCategory("");
    setErrorId("");
    setBusinessCode("");
    setMinCost("");
    setMinTime("");
    setMinOcr("");
    setMinVision("");
    setMinMedications("");
    setPage(1);
    setAppliedFilters(emptyFilters);
  }

  const count = data?.count ?? 0;
  const pageSize = data?.page_size ?? 20;
  const hasNext = page * pageSize < count;
  const hasPrevious = page > 1;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Journal des analyses IA"
        description="Liste paginée de toutes les analyses du pipeline. Filtrez par pharmacie, utilisateur, date, erreur, coût, temps, OCR, score Vision, nombre de médicaments, error_id ou business_code."
      />
      <AdminAiNav />

      <SectionCard title="Filtres">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterInput label="Pharmacie" value={pharmacy} onChange={setPharmacy} />
          <FilterInput label="Utilisateur" value={user} onChange={setUser} />
          <FilterInput label="Date (AAAA-MM-JJ)" value={date} onChange={setDate} />
          <FilterSelect
            label="Statut"
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={[
              { value: "", label: "Tous" },
              { value: "success", label: "Succès" },
              { value: "error", label: "Erreur" },
            ]}
          />
          <FilterSelect
            label="Catégorie d'erreur"
            value={category}
            onChange={(value) => setCategory(value as typeof category)}
            options={[
              { value: "", label: "Toutes" },
              { value: "business", label: "Métier" },
              { value: "technical", label: "Technique" },
            ]}
          />
          <FilterInput label="Error ID" value={errorId} onChange={setErrorId} />
          <FilterInput label="Business code" value={businessCode} onChange={setBusinessCode} />
          <FilterInput label="Coût min (USD)" value={minCost} onChange={setMinCost} type="number" />
          <FilterInput label="Temps min (ms)" value={minTime} onChange={setMinTime} type="number" />
          <FilterInput label="OCR min (lignes)" value={minOcr} onChange={setMinOcr} type="number" />
          <FilterInput
            label="Score Vision min"
            value={minVision}
            onChange={setMinVision}
            type="number"
          />
          <FilterInput
            label="Médicaments min"
            value={minMedications}
            onChange={setMinMedications}
            type="number"
          />
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
          <LoadingBubble label="Chargement des analyses" className="min-h-[260px]" />
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
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Pharmacie</th>
                  <th className="px-3 py-3">Utilisateur</th>
                  <th className="px-3 py-3">Temps total</th>
                  <th className="px-3 py-3">OpenCV</th>
                  <th className="px-3 py-3">Vision</th>
                  <th className="px-3 py-3">Gemini</th>
                  <th className="px-3 py-3">OCR %</th>
                  <th className="px-3 py-3">Prescription %</th>
                  <th className="px-3 py-3">Médicaments</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Erreur</th>
                  <th className="px-3 py-3">Code erreur</th>
                  <th className="px-3 py-3">Error ID</th>
                  <th className="px-3 py-3">Coût</th>
                  <th className="px-3 py-3">Tokens</th>
                  <th className="px-3 py-3">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {data.results.map((analysis) => (
                  <tr key={analysis.analysis_id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3 text-app-muted">
                      {analysis.date ?? "—"}
                      <br />
                      <span className="text-[11px]">{analysis.time ?? ""}</span>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-app-text">
                      {analysis.pharmacy ?? "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-app-text">
                      {analysis.user ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-app-text">
                      {formatMs(analysis.total_duration_ms)}
                    </td>
                    <td className="px-3 py-3 font-mono text-app-muted">
                      {formatMs(analysis.opencv_ms)}
                    </td>
                    <td className="px-3 py-3 font-mono text-app-muted">
                      {formatMs(analysis.vision_ms)}
                    </td>
                    <td className="px-3 py-3 font-mono text-app-muted">
                      {formatMs(analysis.gemini_ms)}
                    </td>
                    <td className="px-3 py-3 text-app-muted">
                      {formatPct(analysis.image_reading_score)}
                    </td>
                    <td className="px-3 py-3 text-app-muted">
                      {formatPct(analysis.prescription_reading_score)}
                    </td>
                    <td className="px-3 py-3 text-app-text">
                      {formatInt(analysis.medications_count)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={analysis.status} />
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
                    <td className="px-3 py-3 font-mono text-app-text">
                      {formatUsd(analysis.estimated_cost_usd)}
                    </td>
                    <td className="px-3 py-3 font-mono text-app-muted">
                      {formatTokens(analysis.total_tokens)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/dashboard/analyses/${encodeURIComponent(analysis.analysis_id)}`}
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

          {!data.results.length ? (
            <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
              Aucune analyse ne correspond aux filtres.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-app-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-app-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
