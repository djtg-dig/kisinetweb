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
    { label: "Ventes", href: route(pharmacyId, "/sales") },
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
