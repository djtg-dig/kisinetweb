import type { PharmacySummary } from "@/lib/api";

export type DashboardStats = {
  products_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  today_sales_count: number;
  today_revenue: number;
  employees_count: number;
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  tone: "warning" | "error" | "info";
  action?: {
    kind: "renew-subscription";
    label: string;
  };
};

type DashboardSubscriptionAlertInput = {
  status?: string | null;
  expiresAt?: string | null;
};

export type SalesDay = {
  label: string;
  sales_count: number;
  revenue: number;
};

export type TopProduct = {
  id: string;
  name: string;
  quantity_sold: number;
  revenue?: number;
};

export type LatestSale = {
  id: string;
  date: string;
  reference: string;
  client?: string;
  amount: number;
  status: string;
};

export type RestockProduct = {
  id: string;
  name: string;
  remaining_quantity: number;
  minimum_threshold: number;
};

export type RecentActivity = {
  id: string;
  date: string;
  label: string;
  description: string;
};

export type DashboardShortcut = {
  label: string;
  href: string;
};

export type PharmacyDashboardData = {
  pharmacy: PharmacySummary;
  stats: DashboardStats;
  alerts: {
    low_stock: DashboardAlert[];
    out_of_stock: DashboardAlert[];
    expiring_products: DashboardAlert[];
    subscription: DashboardAlert | null;
    pending_invoices: DashboardAlert[];
  };
  sales_last_7_days: SalesDay[];
  top_products: TopProduct[];
  latest_sales: LatestSale[];
  restock_products: RestockProduct[];
  recent_activity: RecentActivity[];
  shortcuts: DashboardShortcut[];
};

function route(pharmacyId: string, path: string) {
  return "/app/pharmacies/" + pharmacyId + path;
}

export function getDashboardShortcuts(pharmacyId: string): DashboardShortcut[] {
  return [
    { label: "Nouvelle vente", href: route(pharmacyId, "/sales/create") },
    { label: "Ajouter un produit", href: route(pharmacyId, "/products/create") },
    { label: "Entrée de stock", href: route(pharmacyId, "/stock") },
    { label: "Produits", href: route(pharmacyId, "/products") },
    { label: "Stock", href: route(pharmacyId, "/stock") },
    { label: "Ventes", href: route(pharmacyId, "/sales/create") },
    { label: "Rapports", href: route(pharmacyId, "/reports") },
    { label: "Paramètres", href: route(pharmacyId, "/settings") },
  ];
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Transforme uniquement une alerte déjà décidée par le backend. Le backend
 * conserve donc le seuil d'expiration ; le frontend ne recalcule pas cette règle.
 */
export function getDashboardSubscriptionAlert(
  subscription: DashboardSubscriptionAlertInput | null,
  now = new Date(),
): DashboardAlert | null {
  if (!subscription) {
    return null;
  }

  const status = subscription.status?.trim().toUpperCase();
  const expiry = getSubscriptionAlertDate(subscription.expiresAt);
  const formattedExpiry = expiry ? formatSubscriptionAlertDate(expiry) : undefined;

  if (status === "EXPIRED") {
    return {
      id: "subscription",
      title: "Abonnement expiré",
      description: formattedExpiry
        ? "L'abonnement de cette pharmacie a expiré le " +
          formattedExpiry +
          ". Veuillez renouveler votre abonnement pour continuer à utiliser les fonctionnalités concernées."
        : "L'abonnement de cette pharmacie a expiré. Veuillez renouveler votre abonnement pour continuer à utiliser les fonctionnalités concernées.",
      tone: "error",
      action: {
        kind: "renew-subscription",
        label: "Renouveler l'abonnement",
      },
    };
  }

  // Une date absente, invalide ou déjà passée ne doit jamais produire une
  // promesse d'expiration future. Le statut effectif reste prioritaire.
  if (!expiry || expiry.getTime() <= now.getTime()) {
    return null;
  }

  if (status === "ACTIVE") {
    return {
      id: "subscription",
      title: "Abonnement bientôt expiré",
      description:
        "Votre abonnement expirera le " +
        formattedExpiry +
        ". Pensez à le renouveler pour éviter une interruption du service.",
      tone: "warning",
    };
  }

  if (status === "TRIAL") {
    return {
      id: "subscription",
      title: "Période d'essai bientôt terminée",
      description:
        "Votre période d'essai se terminera le " +
        formattedExpiry +
        ". Pensez à souscrire un abonnement pour éviter une interruption du service.",
      tone: "warning",
    };
  }

  return null;
}

function getSubscriptionAlertDate(value?: string | null): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const dateOnly = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSubscriptionAlertDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
