"use client";

import type { NotificationFilterValue } from "./notification-filters";

type NotificationEmptyStateProps = {
  filter: NotificationFilterValue;
};

export function NotificationEmptyState({ filter }: NotificationEmptyStateProps) {
  const isFiltered = filter === "unread" || filter === "read";

  const title = isFiltered
    ? filter === "unread"
      ? "Aucune notification non lue"
      : "Aucune notification lue"
    : "Aucune notification";

  const description = isFiltered
    ? filter === "unread"
      ? "Vous avez consulté toutes vos notifications."
      : "Vous n'avez pas encore de notification lue."
    : "Les événements importants concernant cette pharmacie apparaîtront ici.";

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-app-border bg-app-card p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-background">
        <svg
          className="h-8 w-8 text-app-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-text">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-app-muted">{description}</p>
    </div>
  );
}

export function NotificationLoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-app-border bg-app-card p-4"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-app-background" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 rounded bg-app-background" />
                <div className="h-3 w-16 rounded bg-app-background" />
              </div>
              <div className="h-3 w-full rounded bg-app-background" />
              <div className="h-3 w-3/4 rounded bg-app-background" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-app-background" />
                <div className="h-5 w-24 rounded-full bg-app-background" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-900/30 dark:bg-red-900/10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          className="h-8 w-8 text-red-600 dark:text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-red-800 dark:text-red-300">
        Impossible de charger les notifications
      </h3>
      <p className="mt-2 max-w-sm text-sm text-red-600 dark:text-red-400">
        {message || "Une erreur inattendue s'est produite. Veuillez réessayer."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
