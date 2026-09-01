"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastMessage } from "@/components/ui/toast";
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
  type NotificationCategory,
  type NotificationFilters as NotificationApiFilters,
  getNotificationCount,
  getNotifications,
  getUnreadNotificationSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from "@/lib/api/notifications";

type NotificationsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "ready";

type NotificationCounts = {
  all: number;
  unread: number;
  read: number;
};

type ToastState = {
  tone: "success" | "error" | "warning";
  text: string;
  key: number;
} | null;

const PAGE_SIZE = "20";

type PharmacyNotificationGroup = {
  key: string;
  label: string;
  description: string;
  categories: NotificationCategory[];
};

// Ces groupes restent propres au contexte pharmacie: les notifications
// personnelles sans pharmacie seront traitees par une future page globale.
const PHARMACY_NOTIFICATION_GROUPS: PharmacyNotificationGroup[] = [
  {
    key: "products",
    label: "Produits",
    description: "Expiration",
    categories: ["PRODUCT_EXPIRATION"],
  },
  {
    key: "stock",
    label: "Stock",
    description: "Niveaux",
    categories: ["STOCK_LOW"],
  },
  {
    key: "ai_credits",
    label: "Credits IA",
    description: "Solde et achats",
    categories: ["AI_CREDIT_LOW", "AI_CREDIT_PURCHASE"],
  },
  {
    key: "subscription",
    label: "Abonnement",
    description: "Statut",
    categories: ["SUBSCRIPTION_PAYMENT", "SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRED"],
  },
  {
    key: "payments",
    label: "Paiements",
    description: "Transactions",
    categories: ["PAYMENT_SUCCESS", "PAYMENT_FAILED"],
  },
  {
    key: "members",
    label: "Membres",
    description: "Acces",
    categories: ["PHARMACY", "MEMBER", "PERMISSION"],
  },
];

export default function PharmacyNotificationsPage({ params }: NotificationsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ all: 0, unread: 0, read: 0 });
  const [summaryGroups, setSummaryGroups] = useState<Record<string, number>>({});
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotificationFilterValue>("all");
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }
    readParams();
  }, [params]);

  const activeCategories = useMemo(() => getCategoriesForPharmacyGroup(activeGroup), [activeGroup]);

  const loadNotificationPage = useCallback(
    async (page = 1, append = false) => {
      const filterIsRead =
        activeFilter === "unread" ? false : activeFilter === "read" ? true : undefined;

      // Le backend filtre par categorie exacte; pour une card UI de groupe,
      // on interroge chaque categorie du groupe sans charger tout l'historique.
      if (activeCategories.length > 0) {
        const responses = await Promise.all(
          activeCategories.map((category) =>
            getNotifications({
              category,
              pharmacy: pharmacyId,
              is_read: filterIsRead,
              page: String(page),
              page_size: PAGE_SIZE,
            }),
          ),
        );
        const groupedNotifications = responses
          .flatMap((response) => response.results)
          .sort(
            (first, second) =>
              new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
          );

        setNotifications((previous) =>
          append ? dedupeNotifications([...previous, ...groupedNotifications]) : groupedNotifications,
        );
        setHasNextPage(responses.some((response) => Boolean(response.next)));
        setCurrentPage(page);
        return;
      }

      const result = await getNotifications({
        pharmacy: pharmacyId,
        is_read: filterIsRead,
        page: String(page),
        page_size: PAGE_SIZE,
      });

      setNotifications((previous) =>
        append ? dedupeNotifications([...previous, ...result.results]) : result.results,
      );
      setHasNextPage(Boolean(result.next));
      setCurrentPage(page);
    },
    [activeCategories, activeFilter, pharmacyId],
  );

  const loadNotifications = useCallback(
    async (page = 1, append = false) => {
      try {
        await loadNotificationPage(page, append);
        setPageState("ready");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Une erreur s'est produite.");
        setPageState("error");
      }
    },
    [loadNotificationPage],
  );

  const loadPageMetadata = useCallback(async () => {
    if (!pharmacyId) return;

    try {
      const [all, unread, read, backendSummary, groupEntries] = await Promise.all([
        getNotificationCount({ pharmacy: pharmacyId }),
        getNotificationCount({ pharmacy: pharmacyId, is_read: false }),
        getNotificationCount({ pharmacy: pharmacyId, is_read: true }),
        getUnreadNotificationSummary({ pharmacy: pharmacyId }),
        Promise.all(
          PHARMACY_NOTIFICATION_GROUPS.map(async (group) => {
            const groupCount = await sumNotificationCounts(
              group.categories.map((category) => ({
                category,
                pharmacy: pharmacyId,
                is_read: false,
              })),
            );
            return [group.key, groupCount] as const;
          }),
        ),
      ]);

      // L'appel valide le resume backend filtre; les cards pharmacie restent plus detaillees.
      void backendSummary;
      setCounts({ all, unread, read });
      setSummaryGroups(Object.fromEntries(groupEntries));
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Impossible de charger le resume des notifications.",
        key: Date.now(),
      });
    }
  }, [pharmacyId]);

  useEffect(() => {
    if (!pharmacyId) return;

    setPageState("loading");
    setNotifications([]);
    setCurrentPage(1);
    loadNotifications(1);
    loadPageMetadata();
  }, [pharmacyId, activeFilter, activeGroup, loadNotifications, loadPageMetadata]);

  const handleMarkAsRead = useCallback(
    async (reference: string) => {
      const notification = notifications.find((item) => item.reference === reference);
      if (!notification || notification.is_read) return;

      try {
        await markNotificationAsRead(reference);
      } catch (err) {
        setToast({
          tone: "error",
          text:
            err instanceof Error
              ? err.message
              : "Impossible de marquer la notification comme lue.",
          key: Date.now(),
        });
        throw err;
      }

      setNotifications((prev) =>
        activeFilter === "unread"
          ? prev.filter((n) => n.reference !== reference)
          : prev.map((n) =>
              n.reference === reference
                ? { ...n, is_read: true, read_at: new Date().toISOString() }
                : n,
            ),
      );

      setCounts((previous) => ({
        all: previous.all,
        unread: Math.max(0, previous.unread - 1),
        read: previous.read + 1,
      }));
      setSummaryGroups((previous) => decrementSummaryGroup(previous, notification.category));
      await loadPageMetadata();
    },
    [activeFilter, loadPageMetadata, notifications],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead({
        pharmacy: pharmacyId,
      });

      setNotifications((prev) =>
        activeFilter === "unread"
          ? []
          : prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      );
      setCounts((previous) => ({
        all: previous.all,
        unread: 0,
        read: previous.all,
      }));
      setSummaryGroups((previous) =>
        Object.fromEntries(Object.keys(previous).map((key) => [key, 0])),
      );
      setToast({ tone: "success", text: "Notifications marquées comme lues.", key: Date.now() });
      await Promise.all([loadNotifications(1), loadPageMetadata()]);
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Impossible de marquer comme lu.",
        key: Date.now(),
      });
    } finally {
      setIsMarkingAll(false);
    }
  }, [activeFilter, loadNotifications, loadPageMetadata, pharmacyId]);

  const handleFilterChange = useCallback((filter: NotificationFilterValue) => {
    setActiveFilter(filter);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveGroup(category);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    loadNotifications(currentPage + 1, true).finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasNextPage, currentPage, loadNotifications]);

  const retryLoad = useCallback(() => {
    setPageState("loading");
    setErrorMessage("");
    loadNotifications();
  }, [loadNotifications]);

  const categoryEntries = useMemo(
    () => PHARMACY_NOTIFICATION_GROUPS.map((group) => [group.key, summaryGroups[group.key] || 0] as const),
    [summaryGroups],
  );

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      {toast && (
        <ToastMessage key={toast.key} tone={toast.tone} onClose={() => setToast(null)}>
          {toast.text}
        </ToastMessage>
      )}

      <section className="rounded-lg border border-app-border bg-app-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-app-text sm:text-3xl">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
              Suivez les événements importants de cette pharmacie.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-app-muted">
              <span className="rounded-full border border-app-border bg-app-background px-3 py-1">
                {counts.all} au total
              </span>
              <span className="rounded-full border border-app-border bg-app-background px-3 py-1">
                {counts.unread} non lue{counts.unread > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {counts.unread > 0 && (
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
          count={counts.unread}
          isActive={activeGroup === ""}
          onClick={handleCategoryChange}
          isAll
        />
        {categoryEntries.map(([category, count]) => (
          <NotificationSummaryCard
            key={category}
            category={category}
            count={count}
            isActive={activeGroup === category}
            onClick={handleCategoryChange}
            label={getPharmacyGroupLabel(category)}
            description={getPharmacyGroupDescription(category)}
          />
        ))}
      </section>

      <section className="mt-6">
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          unreadCount={counts.unread}
          readCount={counts.read}
        />
      </section>

      <section className="mt-6">
        {pageState === "loading" && <NotificationLoadingState />}

        {pageState === "error" && (
          <NotificationErrorState message={errorMessage} onRetry={retryLoad} />
        )}

        {pageState === "ready" && notifications.length === 0 && (
          <NotificationEmptyState filter={activeFilter} hasCategoryFilter={Boolean(activeGroup)} />
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

async function sumNotificationCounts(filters: NotificationApiFilters[]) {
  const counts = await Promise.all(filters.map((filter) => getNotificationCount(filter)));
  return counts.reduce((total, count) => total + count, 0);
}

function getCategoriesForPharmacyGroup(groupKey: string): NotificationCategory[] {
  return PHARMACY_NOTIFICATION_GROUPS.find((group) => group.key === groupKey)?.categories || [];
}

function getPharmacyGroupLabel(groupKey: string) {
  return PHARMACY_NOTIFICATION_GROUPS.find((group) => group.key === groupKey)?.label;
}

function getPharmacyGroupDescription(groupKey: string) {
  return PHARMACY_NOTIFICATION_GROUPS.find((group) => group.key === groupKey)?.description;
}

function decrementSummaryGroup(groups: Record<string, number>, category: string) {
  const group = PHARMACY_NOTIFICATION_GROUPS.find((item) =>
    item.categories.some((itemCategory) => itemCategory === category),
  );

  if (!group) {
    return groups;
  }

  return {
    ...groups,
    [group.key]: Math.max(0, (groups[group.key] || 0) - 1),
  };
}

function dedupeNotifications(notifications: NotificationItem[]) {
  return Array.from(
    new Map(notifications.map((notification) => [notification.reference, notification])).values(),
  );
}
