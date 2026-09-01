import { apiBaseUrl } from "@/lib/carri-account";
import { authenticatedFetch, getApiErrorMessage, parseJsonResponse } from "@/lib/api";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export type NotificationCategory =
  | "AI_CREDIT_LOW"
  | "AI_CREDIT_PURCHASE"
  | "PRODUCT_EXPIRATION"
  | "STOCK_LOW"
  | "SUBSCRIPTION_PAYMENT"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "COMMISSION_RECEIVED"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "WITHDRAWAL_PAID"
  | "PHARMACY"
  | "MEMBER"
  | "PERMISSION"
  | "SYSTEM";

export type NotificationItem = {
  reference: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  pharmacy_reference: string | null;
  pharmacy_name: string | null;
  action_url: string | null;
  source_type: string | null;
  source_reference: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationUnreadSummary = {
  total: number;
  groups: Record<string, number>;
};

export type NotificationUnreadCount = {
  count: number;
};

export type PaginatedNotifications = {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
};

export type NotificationFilters = {
  category?: string;
  pharmacy?: string;
  is_read?: boolean;
  page?: string;
  page_size?: string;
};

export const NOTIFICATION_BADGE_REFRESH_EVENT = "kisinet:notifications_refresh";

type NotificationCategoryGroupDefinition = {
  key: string;
  label: string;
  description: string;
  categories: NotificationCategory[];
};

// Groupes alignes avec le selector backend pour garder les cards resume
// coherentes entre la page pharmacie et une future page globale.
export const NOTIFICATION_CATEGORY_GROUPS: NotificationCategoryGroupDefinition[] = [
  {
    key: "payments",
    label: "Paiements",
    description: "Transactions",
    categories: [
      "SUBSCRIPTION_PAYMENT",
      "PAYMENT_SUCCESS",
      "PAYMENT_FAILED",
      "AI_CREDIT_PURCHASE",
    ],
  },
  {
    key: "commissions",
    label: "Commissions",
    description: "Revenus",
    categories: [
      "COMMISSION_RECEIVED",
      "WITHDRAWAL_REQUESTED",
      "WITHDRAWAL_APPROVED",
      "WITHDRAWAL_REJECTED",
      "WITHDRAWAL_PAID",
    ],
  },
  {
    key: "products",
    label: "Produits",
    description: "Stock & expiration",
    categories: ["PRODUCT_EXPIRATION", "STOCK_LOW"],
  },
  {
    key: "ai_credits",
    label: "Credits IA",
    description: "Utilisation IA",
    categories: ["AI_CREDIT_LOW"],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  AI_CREDIT_LOW: "Crédits IA",
  AI_CREDIT_PURCHASE: "Achat de crédits IA",
  PRODUCT_EXPIRATION: "Produits",
  STOCK_LOW: "Stock",
  SUBSCRIPTION_PAYMENT: "Abonnement",
  SUBSCRIPTION_EXPIRING: "Abonnement",
  SUBSCRIPTION_EXPIRED: "Abonnement",
  PAYMENT_SUCCESS: "Paiements",
  PAYMENT_FAILED: "Paiements",
  COMMISSION_RECEIVED: "Commissions",
  WITHDRAWAL_REQUESTED: "Retraits",
  WITHDRAWAL_APPROVED: "Retraits",
  WITHDRAWAL_REJECTED: "Retraits",
  WITHDRAWAL_PAID: "Retraits",
  PHARMACY: "Pharmacie",
  MEMBER: "Membres",
  PERMISSION: "Permissions",
  SYSTEM: "Système",
};

const CATEGORY_GROUP_LABELS = NOTIFICATION_CATEGORY_GROUPS.reduce<Record<string, string>>(
  (labels, group) => {
    labels[group.key] = group.label;
    return labels;
  },
  {},
);

const CATEGORY_GROUP_DESCRIPTIONS = NOTIFICATION_CATEGORY_GROUPS.reduce<Record<string, string>>(
  (descriptions, group) => {
    descriptions[group.key] = group.description;
    return descriptions;
  },
  {},
);

const SEVERITY_COLORS: Record<NotificationSeverity, { bg: string; text: string; ring: string }> = {
  INFO: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100" },
  SUCCESS: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-100" },
  WARNING: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-100" },
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_GROUP_LABELS[category] || CATEGORY_LABELS[category] || formatUnknownCategory(category);
}

export function getCategoryDescription(category: string): string {
  return CATEGORY_GROUP_DESCRIPTIONS[category] || "Notifications";
}

export function getSeverityColors(severity: NotificationSeverity) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.INFO;
}

export function getCategoriesForGroup(groupKey: string): NotificationCategory[] {
  return NOTIFICATION_CATEGORY_GROUPS.find((group) => group.key === groupKey)?.categories || [];
}

export function notifyNotificationBadgeRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(NOTIFICATION_BADGE_REFRESH_EVENT));
}

function formatUnknownCategory(category: string): string {
  return category
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    reference: String(raw.reference || ""),
    category: (raw.category as NotificationCategory) || "SYSTEM",
    severity: (raw.severity as NotificationSeverity) || "INFO",
    title: String(raw.title || "Notification"),
    message: String(raw.message || ""),
    pharmacy_reference: raw.pharmacy_reference ? String(raw.pharmacy_reference) : null,
    pharmacy_name: raw.pharmacy_name ? String(raw.pharmacy_name) : null,
    action_url: raw.action_url ? String(raw.action_url) : null,
    source_type: raw.source_type ? String(raw.source_type) : null,
    source_reference: raw.source_reference ? String(raw.source_reference) : null,
    is_read: Boolean(raw.is_read),
    read_at: raw.read_at ? String(raw.read_at) : null,
    created_at: String(raw.created_at || new Date().toISOString()),
  };
}

async function fetchNotifications(
  filters: NotificationFilters = {},
): Promise<PaginatedNotifications> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.pharmacy) params.set("pharmacy", filters.pharmacy);
  if (filters.is_read !== undefined) params.set("is_read", String(filters.is_read));
  if (filters.page) params.set("page", filters.page);
  if (filters.page_size) params.set("page_size", filters.page_size);

  const queryString = params.toString();
  const path = "/api/notifications/" + (queryString ? "?" + queryString : "");

  const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de charger les notifications."));
  }

  const record = data as Record<string, unknown>;
  const results = Array.isArray(record.results) ? record.results : [];
  const normalizedResults = results
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map(normalizeNotification);

  return {
    count: Number(record.count ?? normalizedResults.length),
    next: record.next ? String(record.next) : null,
    previous: record.previous ? String(record.previous) : null,
    results: normalizedResults,
  };
}

export async function getNotifications(
  filters: NotificationFilters = {},
): Promise<PaginatedNotifications> {
  return fetchNotifications(filters);
}

export async function getUnreadNotificationCount(filters: Pick<NotificationFilters, "pharmacy"> = {}): Promise<number> {
  try {
    const params = new URLSearchParams();
    if (filters.pharmacy) params.set("pharmacy", filters.pharmacy);

    const queryString = params.toString();
    const path = "/api/notifications/unread-count/" + (queryString ? "?" + queryString : "");

    const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return 0;
    }

    const responseText = await response.text();
    const data = parseJsonResponse(responseText);
    const record = data as Record<string, unknown>;
    return Number(record.count ?? 0);
  } catch {
    return 0;
  }
}

export async function getNotificationCount(filters: NotificationFilters = {}): Promise<number> {
  const result = await getNotifications({ ...filters, page_size: "1" });
  return result.count;
}

export async function getUnreadNotificationCountForPharmacy(pharmacy: string): Promise<number> {
  if (!pharmacy) {
    return 0;
  }

  return getUnreadNotificationCount({ pharmacy });
}

export async function getUnreadNotificationSummary(
  filters: Pick<NotificationFilters, "pharmacy"> = {},
): Promise<NotificationUnreadSummary> {
  try {
    const params = new URLSearchParams();
    if (filters.pharmacy) params.set("pharmacy", filters.pharmacy);

    const queryString = params.toString();
    const path = "/api/notifications/unread-summary/" + (queryString ? "?" + queryString : "");

    const response = await authenticatedFetch(
      apiBaseUrl.replace(/\/$/, "") + path,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return { total: 0, groups: {} };
    }

    const responseText = await response.text();
    const data = parseJsonResponse(responseText);
    const record = data as Record<string, unknown>;
    const groups = record.groups as Record<string, number>;

    return {
      total: Number(record.total ?? 0),
      groups: groups && typeof groups === "object" ? groups : {},
    };
  } catch {
    return { total: 0, groups: {} };
  }
}

export async function markNotificationAsRead(reference: string): Promise<void> {
  const response = await authenticatedFetch(
    apiBaseUrl.replace(/\/$/, "") + "/api/notifications/" + reference + "/read/",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    const data = parseJsonResponse(responseText);
    throw new Error(getApiErrorMessage(data, "Impossible de marquer la notification comme lue."));
  }

  notifyNotificationBadgeRefresh();
}

export async function markAllNotificationsAsRead(options?: {
  category?: string;
  pharmacy?: string;
}): Promise<{ marked_count: number }> {
  const body: Record<string, string> = {};
  if (options?.category) body.category = options.category;
  if (options?.pharmacy) body.pharmacy = options.pharmacy;

  const response = await authenticatedFetch(
    apiBaseUrl.replace(/\/$/, "") + "/api/notifications/read-all/",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    const data = parseJsonResponse(responseText);
    throw new Error(getApiErrorMessage(data, "Impossible de marquer les notifications comme lues."));
  }

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);
  const record = data as Record<string, unknown>;

  notifyNotificationBadgeRefresh();

  return { marked_count: Number(record.marked_count ?? 0) };
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "À l'instant";
  }

  if (diffMins < 60) {
    return "Il y a " + diffMins + " min";
  }

  if (diffHours < 24) {
    return "Il y a " + diffHours + " h";
  }

  if (diffDays === 1) {
    return "Hier";
  }

  if (diffDays < 7) {
    return "Il y a " + diffDays + " jours";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: diffDays > 365 ? "numeric" : undefined,
  }).format(date);
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
