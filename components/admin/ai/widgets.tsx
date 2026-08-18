// Composants partagés du tableau de bord IA (cartouches de statistiques,
// badges de statut, alertes, en-têtes). Respectent le design system Kisinet
// (variables app-*, primary-*, success/warning/error). Aucune dépendance
// externe : tout est en Tailwind + classes sémantiques existantes.

import type { ReactNode } from "react";
import type { AiAlert } from "@/lib/api/admin-ai";

// ---------------------------------------------------------------------------
// Helpers de formatage (réutilisés par toutes les pages)
// ---------------------------------------------------------------------------

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

// Durée en millisecondes -> "850 ms" ou "1,25 s" (lisible pour un dashboard).
export function formatMs(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }
  return `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} s`;
}

// Montant USD -> "$1,23".
export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

export function formatTokens(value: number | null | undefined): string {
  return formatInt(value);
}

// Affiche une valeur (texte ou nombre) ou "—" si absente.
export function orDash(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

// ---------------------------------------------------------------------------
// Cartouche de statistique (Vue générale + pages consommation/coûts)
// ---------------------------------------------------------------------------

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-app-text",
  success: "text-success-600",
  warning: "text-warning",
  error: "text-error",
  info: "text-info",
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-app-muted">{hint}</p> : null}
    </div>
  );
}

// Grille responsive de cartouches.
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
  );
}

// ---------------------------------------------------------------------------
// En-tête de page (titre + description)
// ---------------------------------------------------------------------------

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Administration · IA</p>
      <h2 className="mt-2 text-2xl font-bold text-app-text">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm text-app-muted">{description}</p>
      ) : null}
    </div>
  );
}

// Carte de section générique.
export function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-app-border bg-app-card p-5 shadow-sm ${className}`}
    >
      {title ? (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-app-text">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-app-muted">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Badges de statut (succès / erreur / en cours)
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "success") {
    return (
      <span className="inline-flex rounded-md bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">
        Succès
      </span>
    );
  }
  if (normalized === "error") {
    return (
      <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
        Erreur
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md bg-app-surface px-2.5 py-1 text-xs font-bold text-app-muted">
      En cours
    </span>
  );
}

export function ErrorKindBadge({ category }: { category: string | null | undefined }) {
  if (category === "business") {
    return (
      <span className="inline-flex rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        Métier
      </span>
    );
  }
  if (category === "technical") {
    return (
      <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
        Technique
      </span>
    );
  }
  return <span className="text-xs text-app-muted">—</span>;
}

// ---------------------------------------------------------------------------
// Liste des alertes automatiques (section 7)
// ---------------------------------------------------------------------------

const alertToneClasses: Record<string, string> = {
  warning: "border-warning/40 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  error: "border-error/40 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
};

export function AlertsList({
  alerts,
  emptyLabel = "Aucune alerte active.",
}: {
  alerts: AiAlert[];
  emptyLabel?: string;
}) {
  if (!alerts.length) {
    return (
      <p className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, index) => (
        <li
          key={`${alert.kind}-${index}`}
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            alertToneClasses[alert.severity] ?? "border-app-border bg-app-surface"
          }`}
        >
          {alert.message}
          {alert.value !== null && alert.value !== undefined ? (
            <span className="ml-2 font-mono text-xs opacity-80">
              (valeur : {String(alert.value)}
              {alert.threshold !== null && alert.threshold !== undefined
                ? ` / seuil : ${alert.threshold}`
                : ""}
              )
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
