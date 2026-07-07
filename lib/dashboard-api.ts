import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";
import {
  formatDate,
  getDashboardShortcuts,
  type DashboardAlert,
  type PharmacyDashboardData,
  type RecentActivity,
  type SalesDay,
} from "@/lib/dashboard";

type ApiDashboardResponse = {
  pharmacy: {
    id: string;
    name: string;
    devise?: string;
  };
  stats: {
    products_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    today_sales_count: number;
    today_revenue: number;
    employees_count: number;
  };
  alerts: {
    low_stock_count: number;
    out_of_stock_count: number;
    expiring_products_count: number;
    pending_invoices_count: number;
    subscription: ApiSubscriptionAlert | null;
  };
  sales_last_7_days: ApiSalesDay[];
  top_products: {
    id: string;
    name: string;
    quantity_sold: number;
    revenue?: number;
  }[];
  latest_sales: ApiLatestSale[];
  restock_products: {
    id: string;
    name: string;
    remaining_quantity: number;
    minimum_threshold: number;
  }[];
  recent_activity: ApiActivity[];
};

type ApiStockProduct = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  expiry_date: string | null;
};

type ApiStockAlerts = {
  low_stock: ApiStockProduct[];
  out_of_stock: ApiStockProduct[];
  expiring_products: ApiStockProduct[];
};

type ApiPendingInvoice = {
  id: string;
  reference: string;
  customer: string;
  amount: number;
  created_at: string;
};

type ApiSubscriptionAlert = {
  status: string;
  expires_at: string;
  message: string;
};

type ApiSalesDay = {
  date: string;
  sales_count: number;
  revenue: number;
};

type ApiLatestSale = {
  id: string;
  reference: string;
  customer: string;
  amount: number;
  status: string;
  created_at: string;
};

type ApiActivity = {
  id: string;
  type: string;
  message: string;
  user: string;
  created_at: string;
};

async function fetchDashboardJson<T>(path: string): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
    },
  });

  const responseText = await response.text();
  const data = responseText.trim() ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && typeof data.detail === "string"
        ? data.detail
        : "Impossible de charger le dashboard.";
    throw new Error(detail);
  }

  return data as T;
}

export async function getPharmacyDashboard(pharmacyId: string): Promise<PharmacyDashboardData> {
  const basePath = "/api/pharmacies/" + pharmacyId;
  const [dashboard, stockAlerts, pendingInvoices] = await Promise.all([
    fetchDashboardJson<ApiDashboardResponse>(basePath + "/dashboard/"),
    fetchDashboardJson<ApiStockAlerts>(basePath + "/stock/alerts/"),
    fetchDashboardJson<ApiPendingInvoice[]>(basePath + "/invoices/pending/"),
  ]);

  return {
    pharmacy: {
      id: dashboard.pharmacy.id,
      reference: dashboard.pharmacy.id,
      name: dashboard.pharmacy.name,
      devise: dashboard.pharmacy.devise || "USD",
    },
    stats: dashboard.stats,
    alerts: {
      low_stock: stockAlerts.low_stock.map((product) => stockProductToAlert(product, "warning")),
      out_of_stock: stockAlerts.out_of_stock.map((product) => stockProductToAlert(product, "error")),
      expiring_products: stockAlerts.expiring_products.map((product) =>
        stockProductToAlert(product, "info"),
      ),
      subscription: dashboard.alerts.subscription
        ? subscriptionToAlert(dashboard.alerts.subscription)
        : null,
      pending_invoices: pendingInvoices.map((invoice) =>
        invoiceToAlert(invoice, dashboard.pharmacy.devise || "USD"),
      ),
    },
    sales_last_7_days: dashboard.sales_last_7_days.map(formatSalesDay),
    top_products: dashboard.top_products,
    latest_sales: dashboard.latest_sales.map((sale) => ({
      id: sale.id,
      date: formatDateTime(sale.created_at),
      reference: sale.reference,
      client: sale.customer,
      amount: sale.amount,
      status: sale.status,
    })),
    restock_products: dashboard.restock_products,
    recent_activity: dashboard.recent_activity.map(formatActivity),
    shortcuts: getDashboardShortcuts(dashboard.pharmacy.id),
  };
}

function stockProductToAlert(product: ApiStockProduct, tone: DashboardAlert["tone"]) {
  return {
    id: product.id,
    title: product.name,
    description:
      "Quantité: " + product.quantity + " · Seuil minimum: " + product.min_quantity,
    tone,
  };
}

function subscriptionToAlert(subscription: ApiSubscriptionAlert): DashboardAlert {
  return {
    id: "subscription",
    title: "Abonnement",
    description: subscription.message + " Date: " + formatDate(subscription.expires_at) + ".",
    tone: "warning",
  };
}

function invoiceToAlert(invoice: ApiPendingInvoice, currency: string): DashboardAlert {
  return {
    id: invoice.id,
    title: invoice.reference,
    description: invoice.customer + " · " + formatDashboardCurrency(invoice.amount, currency),
    tone: "warning",
  };
}

function formatDashboardCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSalesDay(day: ApiSalesDay): SalesDay {
  return {
    label: formatShortDay(day.date),
    sales_count: day.sales_count,
    revenue: day.revenue,
  };
}

function formatActivity(activity: ApiActivity): RecentActivity {
  return {
    id: activity.id,
    date: formatDateTime(activity.created_at),
    label: activity.type.replaceAll("_", " "),
    description: activity.user
      ? activity.message + " par " + activity.user
      : activity.message,
  };
}

function formatShortDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", { weekday: "short" });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
