"use client";

import { getCategoryDescription, getCategoryLabel } from "@/lib/api/notifications";

type NotificationSummaryCardProps = {
  category: string;
  count: number;
  isActive: boolean;
  onClick: (category: string) => void;
  isAll?: boolean;
  label?: string;
  description?: string;
};

function SummaryIcon({ category }: { category: string }) {
  const iconClass = "h-5 w-5";
  const normalizedCategory = category.toLowerCase();

  if (category === "all" || category === "Toutes") {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    );
  }

  if (category.includes("AI_CREDIT") || normalizedCategory.includes("ai_credits")) {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.5 2-1.5 3-.5.5-1 1-1 2H16a3 3 0 0 1 3 3c0 1-.5 2-1 3-1.5 1-1.5 2-1.5 3a4 4 0 1 1-8 0c0-1 .5-2 1.5-3 .5-1 1-2 1-3a3 3 0 0 1-3-3h2a2 2 0 0 1 2-2c1 0 1.5-.5 1.5-2a4 4 0 0 0-4-4z" />
        <path d="M12 22v-4" />
      </svg>
    );
  }

  if (
    category.includes("PRODUCT") ||
    category.includes("STOCK") ||
    category.includes("Produits") ||
    normalizedCategory.includes("products") ||
    normalizedCategory.includes("stock")
  ) {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M12 2v20" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      </svg>
    );
  }

  if (
    category.includes("PAYMENT") ||
    category.includes("PAIEMENT") ||
    category.includes("Paiements") ||
    normalizedCategory.includes("payments")
  ) {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }

  if (
    category.includes("COMMISSION") ||
    category.includes("Retraits") ||
    category.includes("Commission") ||
    normalizedCategory.includes("commissions")
  ) {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (
    category.includes("Abonnement") ||
    category.includes("SUBSCRIPTION") ||
    normalizedCategory.includes("subscription")
  ) {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (normalizedCategory.includes("members")) {
    return (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationSummaryCard({
  category,
  count,
  isActive,
  onClick,
  isAll = false,
  label,
  description,
}: NotificationSummaryCardProps) {
  // Les pages peuvent fournir un libelle metier tout en gardant le fallback global.
  const displayLabel = isAll ? "Toutes" : label || getCategoryLabel(category);
  const displayCount = count > 99 ? "99+" : count;
  const displayDescription = isAll ? "Notifications" : description || getCategoryDescription(category);

  return (
    <button
      type="button"
      onClick={() => onClick(isAll ? "" : category)}
      className={`flex min-w-[140px] flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:border-primary-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 ${
        isActive
          ? "border-primary-300 bg-primary-50 shadow-sm dark:bg-primary-900/20"
          : "border-app-border bg-app-card"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-app-muted">
          {displayLabel}
        </span>
        <span
          className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
            isActive
              ? "bg-primary-600 text-white"
              : count > 0
                ? "bg-app-background text-app-text"
                : "bg-app-background text-app-muted"
          }`}
        >
          {displayCount}
        </span>
      </div>
      <div className={`flex items-center gap-1.5 ${isActive ? "text-primary-700" : "text-app-muted"}`}>
        <SummaryIcon category={category} />
        <span className="text-xs">{displayDescription}</span>
      </div>
    </button>
  );
}
