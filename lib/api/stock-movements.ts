import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";
import { getApiErrorMessage, parseJsonResponse } from "@/lib/api";

type UnknownRecord = Record<string, unknown>;

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export type StockMovement = {
  id: string;
  reference?: string;
  pharmacyReference?: string;
  productReference?: string;
  productName: string;
  movementType: string;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reason?: string;
  createdBy?: string;
  createdAt?: string;
};

export type PaginatedStockMovements = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StockMovement[];
};

export type StockMovementFilters = {
  pharmacyReference: string;
  productReference?: string;
  movementType?: string;
  ordering?: string;
  page?: string;
};

export type CreateStockMovementInput = {
  pharmacyReference: string;
  productReference: string;
  movementType: StockMovementType;
  quantity?: number;
  newStock?: number;
  reason?: string;
};

export async function getStockMovements(
  filters: StockMovementFilters,
): Promise<PaginatedStockMovements> {
  const params = new URLSearchParams({ pharmacy_reference: filters.pharmacyReference });
  appendFilter(params, "product_reference", filters.productReference);
  appendFilter(params, "movement_type", filters.movementType);
  appendFilter(params, "ordering", filters.ordering);
  appendFilter(params, "page", filters.page);

  const data = await fetchStockApiJson<unknown>(
    "/api/stock-movements/?" + params.toString(),
    "Impossible de charger les mouvements de stock.",
  );
  const record = getRecord(data);
  const rows: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(record?.results)
      ? record.results
      : [];
  const results = rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizeStockMovement)
    .filter((movement) => Boolean(movement.id));

  return {
    count: Number(record?.count ?? results.length),
    next: getText(record?.next) || null,
    previous: getText(record?.previous) || null,
    results,
  };
}

export async function getStockMovementDetail(id: string): Promise<StockMovement> {
  const data = await fetchStockApiJson<unknown>(
    "/api/stock-movements/" + encodeURIComponent(id) + "/",
    "Impossible de charger ce mouvement de stock.",
  );

  return normalizeStockMovement((getRecord(data) || {}) as UnknownRecord);
}

export async function createStockMovement(
  input: CreateStockMovementInput,
): Promise<StockMovement> {
  const payload = {
    pharmacy_reference: input.pharmacyReference,
    product: input.productReference,
    movement_type: input.movementType,
    quantity: input.movementType === "ADJUSTMENT" ? undefined : input.quantity,
    new_stock: input.movementType === "ADJUSTMENT" ? input.newStock : undefined,
    reason: input.reason || undefined,
  };

  const data = await fetchStockApiJson<unknown>(
    "/api/stock-movements/",
    "Impossible de créer le mouvement de stock.",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeStockMovement((getRecord(data) || {}) as UnknownRecord);
}

async function fetchStockApiJson<T>(
  path: string,
  fallbackMessage: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    ...init,
    headers: {
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

function normalizeStockMovement(item: UnknownRecord): StockMovement {
  const product = getRecord(item.product);
  const user = getRecord(item.created_by) || getRecord(item.user);

  return {
    id: String(item.id ?? item.reference ?? ""),
    reference: getText(item.reference) ?? getText(item.id) ?? "",
    pharmacyReference: getText(item.pharmacy_reference) ?? getText(item.pharmacy),
    productReference:
      getText(item.product_reference) ??
      getText(product?.reference) ??
      getText(item.product),
    productName:
      getText(item.product_name) ??
      getText(product?.name) ??
      getText(item.product_reference) ??
      "Produit non renseigné",
    movementType:
      getText(item.movement_type) ??
      getText(item.type) ??
      getText(item.kind) ??
      "Mouvement",
    quantity: Number(item.quantity ?? item.qty ?? 0),
    previousStock:
      item.previous_stock === undefined || item.previous_stock === null
        ? undefined
        : Number(item.previous_stock),
    newStock:
      item.new_stock === undefined || item.new_stock === null
        ? undefined
        : Number(item.new_stock),
    reason: getText(item.reason) ?? getText(item.note) ?? getText(item.description),
    createdBy:
      getText(item.created_by_email) ??
      getText(item.user_email) ??
      getText(user?.email) ??
      getText(user?.full_name),
    createdAt: getText(item.created_at),
  };
}

function appendFilter(params: URLSearchParams, name: string, value?: string) {
  if (value && value.trim()) {
    params.set(name, value.trim());
  }
}

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function getText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const text = String(value).trim();
  return text || undefined;
}
