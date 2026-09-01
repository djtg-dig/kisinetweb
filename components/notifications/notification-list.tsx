"use client";

import type { NotificationItem as NotificationItemType } from "@/lib/api/notifications";
import { NotificationItemCard } from "./notification-item";

type NotificationListProps = {
  notifications: NotificationItemType[];
  onMarkAsRead: (reference: string) => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

export function NotificationList({
  notifications,
  onMarkAsRead,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      {notifications.map((notification) => (
        <NotificationItemCard
          key={notification.reference}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-6 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "Chargement..." : "Charger plus"}
          </button>
        </div>
      )}
    </section>
  );
}
