"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotificationFilters,
  NotificationList,
  NotificationEmptyState,
  NotificationLoadingState,
  NotificationErrorState,
  NotificationSummaryCard,
  type NotificationFilterValue,
} from "@/components/notifications";
import {
  getNotifications,
  getUnreadNotificationCount,
  getUnreadNotificationSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
  type NotificationUnreadSummary,
} from "@/lib/api/notifications";

type NotificationsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "ready";

export default function PharmacyNotificationsPage({ params }: NotificationsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadSummary, setUnreadSummary] = useState<NotificationUnreadSummary>({
    total: 0,
    groups: {},
  });
  const [totalCount, setTotalCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotificationFilterValue>("all");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }
    readParams();
  }, [params]);

  const loadNotifications = useCallback(
    async (page?: string, append = false) => {
      try {
        const filterIsRead =
          activeFilter === "unread" ? false : activeFilter === "read" ? true : undefined;

        const result = await getNotifications({
          category: activeCategory || undefined,
          pharmacy: pharmacyId || undefined,
          is_read: filterIsRead,
          page,
          page_size: "20",
        });

        setNotifications((prev) => (append ? [...prev, ...result.results] : result.results));
        setHasNextPage(Boolean(result.next));
        setCurrentPage(result.next ? page : undefined);
        setPageState("ready");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Une erreur s'est produite.");
        setPageState("error");
      }
    },
    [activeFilter, activeCategory, pharmacyId],
  );

  const loadUnreadData = useCallback(async () => {
    try {
      const [count, summary] = await Promise.all([
        getUnreadNotificationCount(),
        getUnreadNotificationSummary(),
      ]);

      setUnreadSummary(summary);
      setTotalCount(summary.total);

      const allNotifications = await getNotifications({ page_size: "1" });
      setReadCount(Math.max(0, allNotifications.count - count));
    } catch {
      // Silently fail for badge count
    }
  }, []);

  useEffect(() => {
    if (!pharmacyId) return;

    setPageState("loading");
    setNotifications([]);
    setCurrentPage(undefined);
    loadNotifications();
    loadUnreadData();
  }, [pharmacyId, activeFilter, activeCategory, loadNotifications, loadUnreadData]);

  const handleMarkAsRead = useCallback(
    async (reference: string) => {
      await markNotificationAsRead(reference);

      setNotifications((prev) =>
        prev.map((n) => (n.reference === reference ? { ...n, is_read: true } : n)),
      );

      setUnreadSummary((prev) => {
        const newTotal = Math.max(0, prev.total - 1);
        const newGroups: Record<string, number> = {};
        for (const [key, value] of Object.entries(prev.groups)) {
          newGroups[key] = Math.max(0, value - (notifications.find((n) => n.reference === reference)?.category === key ? 1 : 0));
        }
        return { total: newTotal, groups: newGroups };
      });

      setTotalCount((prev) => Math.max(0, prev - 1));
      setReadCount((prev) => prev + 1);
    },
    [notifications],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead({
        category: activeCategory || undefined,
        pharmacy: pharmacyId || undefined,
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setReadCount((prev) => prev + totalCount);
      setUnreadSummary({ total: 0, groups: {} });
      setTotalCount(0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Impossible de marquer comme lu.");
    } finally {
      setIsMarkingAll(false);
    }
  }, [activeCategory, pharmacyId, totalCount]);

  const handleFilterChange = useCallback((filter: NotificationFilterValue) => {
    setActiveFilter(filter);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    const nextPageNum = currentPage
      ? new URL(currentPage, "http://localhost").searchParams.get("page") || "2"
      : "2";
    loadNotifications(nextPageNum, true).finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasNextPage, currentPage, loadNotifications]);

  const retryLoad = useCallback(() => {
    setPageState("loading");
    setErrorMessage("");
    loadNotifications();
  }, [loadNotifications]);

  const categoryEntries = useMemo(() => Object.entries(unreadSummary.groups), [unreadSummary.groups]);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      <section className="rounded-lg border border-app-border bg-app-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-app-text sm:text-3xl">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
              Suivez les événements importants de votre pharmacie.
            </p>
          </div>

          {totalCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMarkingAll ? "Traitement..." : "Tout marquer comme lu"}
            </button>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <NotificationSummaryCard
          category="all"
          count={totalCount + readCount}
          isActive={activeCategory === ""}
          onClick={handleCategoryChange}
          isAll
        />
        {categoryEntries.map(([category, count]) => (
          <NotificationSummaryCard
            key={category}
            category={category}
            count={count}
            isActive={activeCategory === category}
            onClick={handleCategoryChange}
          />
        ))}
      </section>

      <section className="mt-6">
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          unreadCount={totalCount}
          readCount={readCount}
        />
      </section>

      {errorMessage && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <section className="mt-6">
        {pageState === "loading" && <NotificationLoadingState />}

        {pageState === "error" && <NotificationErrorState message={errorMessage} onRetry={retryLoad} />}

        {pageState === "ready" && notifications.length === 0 && (
          <NotificationEmptyState filter={activeFilter} />
        )}

        {pageState === "ready" && notifications.length > 0 && (
          <NotificationList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
          />
        )}
      </section>
    </main>
  );
}
