"use client";

import { useRouter } from "next/navigation";
import type { NotificationItem as NotificationItemType } from "@/lib/api/notifications";
import {
  getCategoryLabel,
  getSeverityColors,
  formatRelativeTime,
  formatFullDate,
} from "@/lib/api/notifications";

type NotificationItemProps = {
  notification: NotificationItemType;
  onMarkAsRead: (reference: string) => Promise<void>;
};

function NotificationIcon({ category }: { category: string }) {
  const iconClass = "h-5 w-5";

  if (category.includes("AI_CREDIT")) {
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

  if (category.includes("PRODUCT") || category.includes("STOCK")) {
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

  if (category.includes("PAYMENT") || category.includes("SUBSCRIPTION")) {
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

  if (category.includes("COMMISSION") || category.includes("WITHDRAWAL")) {
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

  if (category.includes("MEMBER") || category.includes("PERMISSION")) {
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

  if (category.includes("PHARMACY")) {
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
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
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

export function NotificationItemCard({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();
  const severityColors = getSeverityColors(notification.severity);
  const categoryLabel = getCategoryLabel(notification.category);
  const relativeTime = formatRelativeTime(notification.created_at);
  const fullDate = formatFullDate(notification.created_at);
  const isUnread = !notification.is_read;
  const actionLabel = getActionLabel(notification);

  async function handleClick() {
    if (isUnread) {
      try {
        await onMarkAsRead(notification.reference);
      } catch {
        // Continue navigation even if marking as read fails
      }
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  }

  async function handleReadAction(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isUnread) return;

    try {
      await onMarkAsRead(notification.reference);
    } catch {
      // Silently fail - user can try again
    }
  }

  return (
    <article
      onClick={handleClick}
      className={`group relative cursor-pointer rounded-lg border p-4 transition-all hover:border-primary-300 hover:shadow-sm ${
        isUnread
          ? "border-primary-200 bg-primary-50/50"
          : "border-app-border bg-app-card"
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex gap-4">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityColors.bg} ${severityColors.text}`}
        >
          <NotificationIcon category={notification.category} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isUnread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-label="Non lue" />
              )}
              <h3
                className={`text-sm leading-tight ${isUnread ? "font-semibold text-app-text" : "font-medium text-app-text"}`}
              >
                {notification.title}
              </h3>
            </div>
            <time
              dateTime={notification.created_at}
              title={fullDate}
              className="shrink-0 text-xs text-app-muted"
            >
              {relativeTime}
            </time>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-app-muted">
            {notification.message}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${severityColors.bg} ${severityColors.text} ring-1 ${severityColors.ring}`}>
              {categoryLabel}
            </span>

            {notification.pharmacy_name && (
              <span className="text-xs text-app-muted">
                {notification.pharmacy_name}
              </span>
            )}

            {notification.action_url && (
              <span className="ml-auto text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                {actionLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {isUnread && (
        <button
          type="button"
          onClick={handleReadAction}
          className="absolute right-2 top-2 rounded-md border border-app-border bg-app-surface px-2 py-1 text-xs font-medium text-app-muted opacity-0 transition-opacity hover:bg-primary-50 hover:text-primary-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-200 group-hover:opacity-100"
        >
          Marquer comme lu
        </button>
      )}
    </article>
  );
}

function getActionLabel(notification: NotificationItemType) {
  if (notification.category.includes("PRODUCT") || notification.category.includes("STOCK")) {
    return "Voir le produit";
  }

  if (notification.category.includes("PAYMENT")) {
    return "Voir le paiement";
  }

  if (notification.category.includes("SUBSCRIPTION") || notification.category.includes("AI_CREDIT")) {
    return "Voir l'abonnement";
  }

  return "Voir les détails";
}
