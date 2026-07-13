import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type InvoicePaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERPAID"
  | "CANCELED"
  | "DRAFT"
  | "UNKNOWN";

export type InvoiceStatusOption = {
  value: string;
  label: string;
};

export type InvoiceSummary = {
  totalInvoices: number;
  unpaidInvoices: number;
  partiallyPaidInvoices: number;
  paidInvoices: number;
  remainingAmount: number;
  source: "api" | "current_page";
};

export type Invoice = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  paymentStatus: InvoicePaymentStatus;
  createdBy: string;
  createdAt: string;
};

export type InvoiceFilters = {
  search?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: string;
};

export type PaginatedInvoices = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Invoice[];
  summary: InvoiceSummary;
};

export type PendingInvoice = {
  id: string;
  reference: string;
  customer: string;
  amount: number;
  createdAt: string;
};

export type InvoiceMetadata = {
  statuses: InvoiceStatusOption[];
  paymentStatuses: InvoiceStatusOption[];
  orderings: InvoiceStatusOption[];
};

// Type proche de la réponse brute du backend : les champs restent optionnels car
// l'API peut évoluer ou renvoyer une valeur vide selon le contexte.
type InvoiceApiItem = {
  id?: string | number;
  reference?: string;
  customer_name?: string;
  customer?: string;
  customer_phone?: string;
  subtotal_amount?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
  amount?: string | number;
  paid_amount?: string | number;
  remaining_amount?: string | number;
  status?: string;
  payment_status?: string;
  created_by?: string | { full_name?: string; email?: string; username?: string };
  created_by_name?: string;
  created_at?: string;
};

type InvoiceSummaryApi = {
  total_invoices?: string | number;
  unpaid_invoices?: string | number;
  partially_paid_invoices?: string | number;
  paid_invoices?: string | number;
  remaining_amount?: string | number;
};

type PendingInvoiceApiItem = {
  id?: string | number;
  reference?: string;
  customer?: string;
  amount?: string | number;
  created_at?: string;
};

type InvoiceListApiResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: InvoiceApiItem[];
  summary?: InvoiceSummaryApi;
  stats?: InvoiceSummaryApi;
};

type InvoiceMetadataApiResponse = {
  statuses?: InvoiceStatusOption[];
  payment_statuses?: InvoiceStatusOption[];
  orderings?: InvoiceStatusOption[];
};

export async function getPharmacyInvoices(
  pharmacyId: string,
  filters: InvoiceFilters = {},
): Promise<PaginatedInvoices> {
  const params = new URLSearchParams();
  params.set("pharmacy_reference", pharmacyId);
  appendFilter(params, "search", filters.search);
  appendFilter(params, "page", filters.page);
  appendFilter(params, "date_from", filters.createdFrom);
  appendFilter(params, "date_to", filters.createdTo);

  if (filters.status) {
    if (["UNPAID", "PARTIALLY_PAID", "PAID", "OVERPAID"].includes(filters.status)) {
      params.set("payment_status", filters.status);
    } else {
      params.set("status", filters.status);
    }
  }

  const data = await fetchInvoicesJson<unknown>("/api/sales/?" + params.toString());
  const page = normalizeInvoicePage(data);

  return {
    ...page,
    summary: page.summary || buildCurrentPageSummary(page.count, page.results),
  };
}

export async function getInvoiceMetadata(pharmacyId: string): Promise<InvoiceMetadata> {
  const params = new URLSearchParams();
  params.set("pharmacy_reference", pharmacyId);

  const data = await fetchInvoicesJson<InvoiceMetadataApiResponse>(
    "/api/sales/metadata/?" + params.toString(),
  );

  return {
    statuses: data.statuses || [],
    paymentStatuses: data.payment_statuses || [],
    orderings: data.orderings || [],
  };
}

export async function getPendingPharmacyInvoices(pharmacyId: string): Promise<PendingInvoice[]> {
  const data = await fetchInvoicesJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/invoices/pending/",
  );

  if (!Array.isArray(data)) {
    return [];
  }

  // La page consomme un modèle stable même si l'API renvoie des nombres sous forme de chaînes.
  return data.map((item) => normalizePendingInvoice((item || {}) as PendingInvoiceApiItem));
}

async function fetchInvoicesJson<T>(path: string): Promise<T> {
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

  // On lit d'abord en texte pour pouvoir gérer proprement une réponse vide ou non JSON.
  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de charger les factures."));
  }

  return data as T;
}

function normalizeInvoicePage(data: unknown): PaginatedInvoices {
  if (Array.isArray(data)) {
    const results = data.map((item) => normalizeInvoice((item || {}) as InvoiceApiItem));
    return {
      count: results.length,
      next: null,
      previous: null,
      results,
      summary: buildCurrentPageSummary(results.length, results),
    };
  }

  if (!data || typeof data !== "object") {
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
      summary: buildCurrentPageSummary(0, []),
    };
  }

  const record = data as InvoiceListApiResponse;
  const results = (record.results || []).map((item) => normalizeInvoice(item || {}));
  const apiSummary = normalizeApiSummary(record.summary || record.stats);

  return {
    count: Number(record.count || results.length),
    next: record.next || null,
    previous: record.previous || null,
    results,
    summary: apiSummary || buildCurrentPageSummary(Number(record.count || results.length), results),
  };
}

function normalizeInvoice(item: InvoiceApiItem): Invoice {
  const totalAmount = toNumber(item.total_amount ?? item.amount);
  const paidAmount = toNumber(item.paid_amount);
  const remainingAmount =
    item.remaining_amount === undefined ? Math.max(totalAmount - paidAmount, 0) : toNumber(item.remaining_amount);
  const paymentStatus = normalizePaymentStatus(item.payment_status || item.status, remainingAmount, paidAmount);

  // Cette fonction convertit la réponse backend vers le type utilisé par les composants React.
  return {
    id: String(item.id || item.reference || ""),
    reference: item.reference || "Facture sans référence",
    customerName: item.customer_name || item.customer || "Client non renseigné",
    customerPhone: item.customer_phone || "Non renseigné",
    subtotalAmount: toNumber(item.subtotal_amount),
    discountAmount: toNumber(item.discount_amount),
    totalAmount,
    paidAmount,
    remainingAmount,
    status: item.status || paymentStatus,
    paymentStatus,
    createdBy: normalizeCreatedBy(item.created_by, item.created_by_name),
    createdAt: item.created_at || "",
  };
}

function normalizePendingInvoice(item: PendingInvoiceApiItem): PendingInvoice {
  return {
    id: String(item.id || item.reference || ""),
    reference: item.reference || "Facture sans référence",
    customer: item.customer || "Client non renseigné",
    amount: toNumber(item.amount),
    createdAt: item.created_at || "",
  };
}

function normalizeApiSummary(summary?: InvoiceSummaryApi): InvoiceSummary | null {
  if (!summary) {
    return null;
  }

  return {
    totalInvoices: toNumber(summary.total_invoices),
    unpaidInvoices: toNumber(summary.unpaid_invoices),
    partiallyPaidInvoices: toNumber(summary.partially_paid_invoices),
    paidInvoices: toNumber(summary.paid_invoices),
    remainingAmount: toNumber(summary.remaining_amount),
    source: "api",
  };
}

function buildCurrentPageSummary(totalCount: number, invoices: Invoice[]): InvoiceSummary {
  return {
    totalInvoices: totalCount,
    unpaidInvoices: invoices.filter((invoice) => invoice.paymentStatus === "UNPAID").length,
    partiallyPaidInvoices: invoices.filter((invoice) => invoice.paymentStatus === "PARTIALLY_PAID").length,
    paidInvoices: invoices.filter((invoice) => invoice.paymentStatus === "PAID").length,
    remainingAmount: invoices.reduce((total, invoice) => total + invoice.remainingAmount, 0),
    source: "current_page",
  };
}

function normalizePaymentStatus(
  value: string | undefined,
  remainingAmount: number,
  paidAmount: number,
): InvoicePaymentStatus {
  const normalized = (value || "").toUpperCase();
  if (["UNPAID", "PARTIALLY_PAID", "PAID", "OVERPAID", "CANCELED", "DRAFT"].includes(normalized)) {
    return normalized as InvoicePaymentStatus;
  }

  if (remainingAmount <= 0 && paidAmount > 0) {
    return "PAID";
  }

  if (paidAmount > 0 && remainingAmount > 0) {
    return "PARTIALLY_PAID";
  }

  return "UNPAID";
}

function normalizeCreatedBy(
  createdBy: InvoiceApiItem["created_by"],
  createdByName?: string,
) {
  if (createdByName) {
    return createdByName;
  }

  if (typeof createdBy === "string") {
    return createdBy;
  }

  if (createdBy && typeof createdBy === "object") {
    return createdBy.full_name || createdBy.email || createdBy.username || "Non renseigné";
  }

  return "Non renseigné";
}

function appendFilter(params: URLSearchParams, key: string, value?: string) {
  if (value && value.trim()) {
    params.set(key, value.trim());
  }
}

function toNumber(value: string | number | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function parseJsonResponse(responseText: string) {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function getApiErrorMessage(data: unknown, fallbackMessage: string): string {
  // `unknown` oblige TypeScript à vérifier le type avant d'accéder aux propriétés.
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return fallbackMessage;
  }

  const detail = (data as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail : fallbackMessage;
}
