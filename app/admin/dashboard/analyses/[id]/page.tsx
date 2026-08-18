// Détail complet d'une analyse IA (section 4 du cahier des charges).
//
// Accessible depuis la liste. Affiche image, OCR, consommations, erreurs,
// stacktrace et l'ensemble des diagnostics enregistrés. Données réservées aux
// administrateurs (endpoint /api/admin/ai/analyses/<id>/).

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAiAnalysis, type AiAnalysis } from "@/lib/api/admin-ai";
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
  orDash,
} from "@/components/admin/ai/widgets";

type PageState = "loading" | "ready" | "error";

export default function AdminAiAnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const analysisId = decodeURIComponent(params.id ?? "");

  const [state, setState] = useState<PageState>("loading");
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!analysisId) {
      setState("error");
      setMessage("Identifiant d'analyse manquant.");
      return;
    }
    let isCurrent = true;

    async function load() {
      setState("loading");
      setMessage("");
      try {
        const result = await getAiAnalysis(analysisId);
        if (!isCurrent) {
          return;
        }
        setAnalysis(result);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Analyse introuvable.");
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [analysisId, refreshIndex]);

  return (
    <section className="space-y-4">
      <PageHeader
        title="Détail de l'analyse IA"
        description={`Analyse ${analysisId || ""}`}
      />
      <AdminAiNav />

      <div>
        <Link
          href="/admin/dashboard/analyses"
          className="text-sm font-semibold text-primary-700 hover:underline"
        >
          ← Retour au journal des analyses
        </Link>
      </div>

      {state === "loading" && (
        <SectionCard>
          <LoadingBubble label="Chargement du détail" className="min-h-[260px]" />
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

      {state === "ready" && analysis ? (
        <DetailContent analysis={analysis} />
      ) : null}
    </section>
  );
}

function DetailContent({ analysis }: { analysis: AiAnalysis }) {
  const vision = analysis.vision ?? {};
  const scores = analysis.scores ?? {};
  const steps = analysis.steps ?? [];
  const durations = analysis.durations_ms ?? {};
  const diagnostics =
    (analysis.events?.find((event) => event.pipeline_diagnostics) as
      | Record<string, any>
      | undefined)?.pipeline_diagnostics ?? null;

  return (
    <>
      <SectionCard title="Identité et statut">
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <Field label="Statut">
            <StatusBadge status={analysis.status} />
          </Field>
          <Field label="Date">{`${analysis.date ?? "—"} ${analysis.time ?? ""}`}</Field>
          <Field label="Pharmacie">{orDash(analysis.pharmacy)}</Field>
          <Field label="Utilisateur">{orDash(analysis.user)}</Field>
          <Field label="Modèle Gemini">{orDash(analysis.gemini_model)}</Field>
          <Field label="Modèle Vision">{orDash(analysis.vision_model)}</Field>
          <Field label="Version pipeline">{orDash(analysis.pipeline_version)}</Field>
          <Field label="Version prompt">{orDash(analysis.prompt_version)}</Field>
        </div>
      </SectionCard>

      {analysis.category ? (
        <SectionCard title="Erreur">
          <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
            <Field label="Type">
              <ErrorKindBadge category={analysis.category} />
            </Field>
            <Field label={analysis.category === "business" ? "Business code" : "Technical code"}>
              {orDash(analysis.business_code ?? analysis.technical_code)}
            </Field>
            <Field label="Error ID">{orDash(analysis.error_id)}</Field>
            <Field label="Étape">{orDash(analysis.stage)}</Field>
          </div>
          {analysis.error_message ? (
            <p className="mt-3 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text">
              {analysis.error_message}
            </p>
          ) : null}
          {analysis.stacktrace ? (
            <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950 dark:text-red-200">
              {analysis.stacktrace}
            </pre>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Images">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-app-muted">Image originale</p>
            {analysis.capture_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={analysis.capture_image_url}
                alt="Image originale de la capture"
                className="max-h-72 w-full rounded-md border border-app-border object-contain bg-app-surface"
              />
            ) : (
              <p className="text-sm text-app-muted">
                Image non disponible (la capture n'a pas pu être reliée).
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-app-muted">Image OpenCV</p>
            <p className="text-sm text-app-muted">
              Le pipeline ne persiste pas l'image intermédiaire OpenCV ; seule la taille
              est journalisée ({orDash((vision as any).opencv_image_size_bytes)} o).
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="OCR et scores de lecture">
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <Field label="Score lecture image">
            {formatPct(analysis.image_reading_score)}
          </Field>
          <Field label="Score lecture ordonnance">
            {formatPct(analysis.prescription_reading_score)}
          </Field>
          <Field label="Lignes OCR">{formatInt((vision as any).ocr_lines_count)}</Field>
          <Field label="Caractères OCR">{formatInt((vision as any).ocr_length)}</Field>
        </div>
        {(vision as any).ocr_preview ? (
          <pre className="mt-3 max-h-48 overflow-auto rounded-md border border-app-border bg-app-surface p-3 text-xs text-app-text">
            {(vision as any).ocr_preview}
          </pre>
        ) : null}
      </SectionCard>

      <SectionCard title="Temps détaillés">
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <Field label="OpenCV">{formatMs(analysis.opencv_ms)}</Field>
          <Field label="Vision">{formatMs(analysis.vision_ms)}</Field>
          <Field label="Gemini">{formatMs(analysis.gemini_ms)}</Field>
          <Field label="Total">{formatMs(analysis.total_duration_ms)}</Field>
        </div>
        {steps.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[640px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  <th className="px-3 py-2">Étape</th>
                  <th className="px-3 py-2">Modèle</th>
                  <th className="px-3 py-2">Durée</th>
                  <th className="px-3 py-2">Tokens</th>
                  <th className="px-3 py-2">Coût</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {steps.map((step, index) => (
                  <tr key={`${step.stage}-${index}`}>
                    <td className="px-3 py-2 font-mono text-app-text">{step.stage ?? "—"}</td>
                    <td className="px-3 py-2 text-app-muted">{step.model_name ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-app-muted">
                      {formatMs(step.duration_ms)}
                    </td>
                    <td className="px-3 py-2 font-mono text-app-muted">
                      {formatTokens(step.total_tokens)}
                    </td>
                    <td className="px-3 py-2 font-mono text-app-text">
                      {formatUsd(step.estimated_cost_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Consommation, tokens et coût">
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <Field label="Tokens totaux">{formatTokens(analysis.total_tokens)}</Field>
          <Field label="Coût estimé">{formatUsd(analysis.estimated_cost_usd)}</Field>
          <Field label="Médicaments détectés">
            {formatInt(analysis.medications_count)}
          </Field>
          <Field label="Médicaments (scores)">
            {formatInt((scores as any).medications_count)}
          </Field>
        </div>
      </SectionCard>

      {diagnostics ? (
        <SectionCard title="Diagnostics enregistrés">
          <pre className="max-h-72 overflow-auto rounded-md border border-app-border bg-app-surface p-3 text-xs text-app-text">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </SectionCard>
      ) : null}

      <SectionCard title="Événements bruts">
        <p className="mb-2 text-sm text-app-muted">
          Ensemble des événements journalisés pour cette analyse.
        </p>
        <div className="space-y-2">
          {(analysis.events ?? []).map((event, index) => (
            <details
              key={index}
              className="rounded-md border border-app-border bg-app-surface"
            >
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-app-text">
                {String((event as any).event ?? `événement ${index + 1}`)}
              </summary>
              <pre className="max-h-72 overflow-auto border-t border-app-border p-3 text-xs text-app-muted">
                {JSON.stringify(event, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      </SectionCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p>
      <div className="mt-1 text-app-text">{children}</div>
    </div>
  );
}
