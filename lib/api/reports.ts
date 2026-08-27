import { authenticatedFetch, type PharmacyDetail } from "@/lib/api";
import { apiBaseUrl } from "@/lib/carri-account";

/**
 * Client API des rapports pharmacie.
 *
 * Les calculs métier restent côté backend : ce module ne fait que typer,
 * appeler les endpoints `/reports/` et normaliser les champs d'affichage.
 */

export type ReportPeriod = {
  startDate?: string;
  endDate?: string;
};

export type ReportFeatureKey = "reports";

export type ReportFeatures = {
  reports: boolean;
};

export type ReportFilters = ReportPeriod & {
  page?: string;
};

export type SalesReportFilters = ReportFilters & {
  user?: string;
  product?: string;
};

export type ExpirationReportFilters = ReportFilters & {
  status?: ExpirationStatus | "";
};

export type ReportOverview = {
  salesCount: number;
  revenue: number;
  itemsSold: number;
  activeProducts: number;
  totalStock: number;
  outOfStockProducts: number;
  expiringSoonProducts: number;
  expiredProducts: number;
};

export type SalesReportSummary = {
  salesCount: number;
  itemsSold: number;
  revenue: number;
};

export type SalesReportItem = {
  reference: string;
  date: string;
  user: string;
  total: number;
  itemsCount: number;
};

export type SalesReport = {
  count: number;
  next: string | null;
  previous: string | null;
  summary: SalesReportSummary;
  results: SalesReportItem[];
};

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | string;

export type InventoryReportSummary = {
  productsCount: number;
  totalStockQuantity: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  estimatedStockValue: number | null;
};

export type InventoryReportItem = {
  reference: string;
  product: string;
  stock: number;
  purchasePrice: number | null;
  salePrice: number | null;
  stockStatus: InventoryStockStatus;
  estimatedValue: number | null;
};

export type InventoryReport = {
  count: number;
  next: string | null;
  previous: string | null;
  summary: InventoryReportSummary;
  results: InventoryReportItem[];
};

export type ExpirationStatus = "expired" | "expiring_soon" | "valid" | "no_expiration";

export type ExpirationReportSummary = {
  expired: number;
  expiringSoon: number;
  valid: number;
  noExpiration: number;
};

export type ExpirationReportItem = {
  reference: string;
  product: string;
  currentStock: number;
  expirationDate: string | null;
  status: ExpirationStatus | string;
};

export type ExpirationReport = {
  count: number;
  next: string | null;
  previous: string | null;
  summary: ExpirationReportSummary;
  results: ExpirationReportItem[];
};

type UnknownRecord = Record<string, unknown>;
type PaginatedApiResponse = {
  count?: number | string;
  data?: unknown[];
  next?: string | null;
  previous?: string | null;
  results?: unknown[];
  summary?: unknown;
  stats?: unknown;
};

const defaultReportFeatures: ReportFeatures = {
  reports: false,
};

export async function getReportOverview(
  pharmacyReference: string,
  period: ReportPeriod = {},
): Promise<ReportOverview> {
  const data = await fetchReportsJson<unknown>(
    buildReportPath(pharmacyReference, "overview", period),
    "Impossible de charger le rapport.",
  );

  return normalizeOverview(getRecord(data) || {});
}

export async function getSalesReport(
  pharmacyReference: string,
  filters: SalesReportFilters = {},
): Promise<SalesReport> {
  const data = await fetchReportsJson<unknown>(
    buildReportPath(pharmacyReference, "sales", filters),
    "Impossible de charger le rapport des ventes.",
  );

  return normalizeSalesReport(data);
}

export async function getInventoryReport(
  pharmacyReference: string,
  filters: ReportFilters = {},
): Promise<InventoryReport> {
  const data = await fetchReportsJson<unknown>(
    buildReportPath(pharmacyReference, "inventory", filters),
    "Impossible de charger le rapport du stock.",
  );

  return normalizeInventoryReport(data);
}

export async function getExpirationReport(
  pharmacyReference: string,
  filters: ExpirationReportFilters = {},
): Promise<ExpirationReport> {
  const data = await fetchReportsJson<unknown>(
    buildReportPath(pharmacyReference, "expirations", filters),
    "Impossible de charger le rapport des péremptions.",
  );

  return normalizeExpirationReport(data);
}

export function getReportFeaturesFromPharmacy(pharmacy: PharmacyDetail): ReportFeatures {
  const subscription = getRecord(pharmacy.subscription);
  const featureSources = [
    subscription?.features,
    getRecord(subscription?.plan)?.features,
    getRecord(subscription?.pricing_plan)?.features,
    getRecord(subscription?.plan_snapshot)?.features,
  ];

  for (const source of featureSources) {
    const features = normalizeFeatureMap(source);
    if (features) {
      return features;
    }
  }

  return defaultReportFeatures;
}

function buildReportPath(
  pharmacyReference: string,
  section: "overview" | "sales" | "inventory" | "expirations",
  filters: ReportFilters | SalesReportFilters | ExpirationReportFilters,
) {
  const params = new URLSearchParams();
  appendFilter(params, "start_date", filters.startDate);
  appendFilter(params, "end_date", filters.endDate);
  appendFilter(params, "page", filters.page);

  if ("user" in filters) {
    appendFilter(params, "user", filters.user);
  }
  if ("product" in filters) {
    appendFilter(params, "product", filters.product);
  }
  if ("status" in filters) {
    appendFilter(params, "status", filters.status);
  }

  const query = params.toString();
  return (
    "/api/pharmacies/" +
    encodeURIComponent(pharmacyReference) +
    "/reports/" +
    section +
    "/" +
    (query ? "?" + query : "")
  );
}

async function fetchReportsJson<T>(path: string, fallbackMessage: string): Promise<T> {
  const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

function normalizeOverview(item: UnknownRecord): ReportOverview {
  const summary = getRecord(item.summary) || item;

  return {
    salesCount: numberFrom(summary.sales_count ?? summary.total_sales ?? summary.salesCount),
    revenue: numberFrom(summary.revenue ?? summary.total_revenue ?? summary.turnover),
    itemsSold: numberFrom(summary.items_sold ?? summary.total_items_sold ?? summary.itemsSold),
    activeProducts: numberFrom(summary.active_products ?? summary.products_active ?? summary.activeProducts),
    totalStock: numberFrom(summary.total_stock ?? summary.stock_total ?? summary.totalStock),
    outOfStockProducts: numberFrom(summary.out_of_stock_products ?? summary.out_of_stock ?? summary.outOfStockProducts),
    expiringSoonProducts: numberFrom(summary.expiring_soon_products ?? summary.expiring_soon ?? summary.expiringSoonProducts),
    expiredProducts: numberFrom(summary.expired_products ?? summary.expired ?? summary.expiredProducts),
  };
}

function normalizeSalesReport(data: unknown): SalesReport {
  const page = normalizePage(data);
  const summary = normalizeSalesSummary(page.summary || getRecord(data)?.summary || getRecord(data)?.stats);

  return {
    ...page,
    summary,
    results: page.results.map((item) => normalizeSalesItem(item)),
  };
}

function normalizeInventoryReport(data: unknown): InventoryReport {
  const page = normalizePage(data);

  return {
    ...page,
    summary: normalizeInventorySummary(page.summary || getRecord(data)?.summary || getRecord(data)?.stats),
    results: page.results.map((item) => normalizeInventoryItem(item)),
  };
}

function normalizeExpirationReport(data: unknown): ExpirationReport {
  const page = normalizePage(data);

  return {
    ...page,
    summary: normalizeExpirationSummary(page.summary || getRecord(data)?.summary || getRecord(data)?.stats),
    results: page.results.map((item) => normalizeExpirationItem(item)),
  };
}

function normalizePage(data: unknown) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      summary: null,
      results: data.filter(isRecord),
    };
  }

  const record = getRecord(data) as PaginatedApiResponse | null;
  // Le backend Rapports renvoie les lignes dans `data`; `results` reste accepté
  // pour garder la compatibilité avec une pagination DRF standard.
  const rawResults = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(record?.results)
      ? record.results
      : [];
  const results = rawResults.filter(isRecord);

  return {
    count: numberFrom(record?.count ?? results.length),
    next: typeof record?.next === "string" ? record.next : null,
    previous: typeof record?.previous === "string" ? record.previous : null,
    summary: record?.summary ?? record?.stats ?? null,
    results,
  };
}

function normalizeSalesSummary(value: unknown): SalesReportSummary {
  const record = getRecord(value) || {};

  return {
    salesCount: numberFrom(record.sales_count ?? record.total_sales ?? record.salesCount),
    itemsSold: numberFrom(record.items_sold ?? record.total_items_sold ?? record.itemsSold),
    revenue: numberFrom(record.revenue ?? record.total_revenue ?? record.turnover),
  };
}

function normalizeSalesItem(item: UnknownRecord): SalesReportItem {
  const createdBy = item.user ?? item.created_by ?? item.created_by_name ?? item.cashier;

  return {
    reference: stringFrom(item.reference ?? item.sale_reference ?? item.id, "Vente sans référence"),
    date: stringFrom(item.date ?? item.created_at ?? item.createdAt, ""),
    user: normalizePerson(createdBy),
    total: numberFrom(item.total ?? item.total_amount ?? item.amount),
    itemsCount: numberFrom(item.items_count ?? item.items ?? item.total_items ?? item.itemsCount),
  };
}

function normalizeInventorySummary(value: unknown): InventoryReportSummary {
  const record = getRecord(value) || {};
  const stockValue = record.estimated_stock_value ?? record.stock_value ?? record.estimatedStockValue;

  return {
    productsCount: numberFrom(record.products_count ?? record.total_products ?? record.productsCount),
    totalStockQuantity: numberFrom(record.total_stock_quantity ?? record.total_stock ?? record.stock_total ?? record.totalStockQuantity),
    outOfStockProducts: numberFrom(
      record.out_of_stock_products ?? record.out_of_stock_products_count ?? record.out_of_stock ?? record.outOfStockProducts,
    ),
    lowStockProducts: numberFrom(
      record.low_stock_products ?? record.low_stock_products_count ?? record.low_stock ?? record.lowStockProducts,
    ),
    estimatedStockValue: stockValue === null || stockValue === undefined ? null : numberFrom(stockValue),
  };
}

function normalizeInventoryItem(item: UnknownRecord): InventoryReportItem {
  const product = item.product;
  const productRecord = getRecord(product);
  const purchasePrice = item.purchase_price ?? productRecord?.purchase_price;
  const salePrice = item.sale_price ?? productRecord?.sale_price;
  const estimatedValue = item.estimated_value ?? item.stock_value;

  return {
    reference: stringFrom(item.reference ?? productRecord?.reference ?? item.product_reference, "Produit sans référence"),
    product: stringFrom(item.product_name ?? item.name ?? productRecord?.name ?? product, "Produit sans nom"),
    stock: numberFrom(item.stock ?? item.current_stock ?? item.quantity),
    purchasePrice: purchasePrice === null || purchasePrice === undefined ? null : numberFrom(purchasePrice),
    salePrice: salePrice === null || salePrice === undefined ? null : numberFrom(salePrice),
    stockStatus: stringFrom(item.stock_status ?? item.status, "IN_STOCK"),
    estimatedValue: estimatedValue === null || estimatedValue === undefined ? null : numberFrom(estimatedValue),
  };
}

function normalizeExpirationSummary(value: unknown): ExpirationReportSummary {
  const record = getRecord(value) || {};

  return {
    expired: numberFrom(record.expired ?? record.expired_products_count),
    expiringSoon: numberFrom(record.expiring_soon ?? record.expiring_soon_products_count ?? record.expiringSoon),
    valid: numberFrom(record.valid ?? record.valid_products_count),
    noExpiration: numberFrom(
      record.no_expiration ?? record.products_without_expiration_date_count ?? record.without_expiration ?? record.noExpiration,
    ),
  };
}

function normalizeExpirationItem(item: UnknownRecord): ExpirationReportItem {
  const product = item.product;
  const productRecord = getRecord(product);

  return {
    reference: stringFrom(item.reference ?? productRecord?.reference ?? item.product_reference, "Produit sans référence"),
    product: stringFrom(item.product_name ?? item.name ?? productRecord?.name ?? product, "Produit sans nom"),
    currentStock: numberFrom(item.current_stock ?? item.stock ?? item.quantity),
    expirationDate: nullableString(item.expiration_date ?? item.expires_at),
    status: stringFrom(item.status, "valid"),
  };
}

function normalizeFeatureMap(value: unknown): ReportFeatures | null {
  if (Array.isArray(value)) {
    const entries = value
      .filter(isRecord)
      .map((feature) => [
        stringFrom(feature.key ?? feature.label ?? feature.name, ""),
        Boolean(feature.enabled),
      ]);

    return normalizeFeatureMap(Object.fromEntries(entries));
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as UnknownRecord;

  // Une seule feature `reports` pilote tous les rapports côté frontend.
  return {
    reports: Boolean(record.reports),
  };
}

function normalizePerson(value: unknown): string {
  const record = getRecord(value);
  if (record) {
    return stringFrom(record.full_name ?? record.email ?? record.username, "Non renseigné");
  }

  return stringFrom(value, "Non renseigné");
}

function appendFilter(params: URLSearchParams, name: string, value?: string) {
  if (value && value.trim()) {
    params.set(name, value.trim());
  }
}

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object";
}

function numberFrom(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringFrom(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : value === undefined || value === null ? fallback : String(value);
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value);
  return text.trim() ? text : null;
}

function parseJsonResponse(responseText: string): unknown {
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
  if (!data || typeof data !== "object") {
    return fallbackMessage;
  }

  const detail = (data as { detail?: unknown }).detail;
  return typeof detail === "string" && detail.trim() ? detail : fallbackMessage;
}
