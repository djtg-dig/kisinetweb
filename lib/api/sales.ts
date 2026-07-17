import {
  getAccountProfile,
  getPharmacyProducts,
  type AccountProfile,
  type ProductSummary,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type DiscountType = "none" | "percent" | "amount";

export type SaleProduct = {
  reference: string;
  name: string;
  form?: string;
  dosage?: string;
  barcode?: string;
  salePrice: number;
  availableStock: number;
  expirationDate?: string;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
};

export type SaleDraftItem = {
  product: SaleProduct;
  quantity: number;
};

export type CreateSalePayload = {
  pharmacyReference: string;
  items: {
    productReference: string;
    quantity: number;
    unitPrice: number;
  }[];
  customer?: {
    name?: string;
    phone?: string;
  };
  discount?: {
    type: DiscountType;
    value: number;
    reason?: string;
  };
};

export type SaleDraftStorage = {
  customerName: string;
  customerPhone: string;
  discountType: DiscountType;
  discountValue: string;
  discountReason: string;
  items: SaleDraftItem[];
};

const SALE_DRAFT_KEY_PREFIX = "kisinet_sale_draft:";

export async function searchSaleProducts(
  pharmacyId: string,
  query: string,
): Promise<SaleProduct[]> {
  const page = await getPharmacyProducts(pharmacyId, {
    search: query.trim(),
    ordering: "name",
    page: "1",
  });

  return page.results.map(normalizeSaleProduct);
}

export async function getCurrentCashierName(): Promise<string> {
  try {
    const profile: AccountProfile = await getAccountProfile();
    const names = [profile.firstName, profile.lastName].filter(Boolean);
    return names.length ? names.join(" ") : profile.email || "Non renseigné";
  } catch {
    return "Non renseigné";
  }
}

export type CreatedSale = {
  reference: string;
  pharmacy: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  paid_amount: string;
  change_amount: string;
  status: string;
  items: {
    pharmacy: string;
    product: string;
    product_name: string;
    unit_price: string;
    quantity: number;
    total_price: string;
  }[];
  created_at?: string;
};

export async function createSale(payload: CreateSalePayload): Promise<CreatedSale> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const subtotal = payload.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
  const discountAmount = calculateDiscountAmount(
    subtotal,
    payload.discount?.type || "none",
    payload.discount?.value || 0,
  );

  const body = {
    pharmacy: payload.pharmacyReference,
    customer_name: payload.customer?.name || "",
    customer_phone: payload.customer?.phone || "",
    discount_amount: String(discountAmount),
    items: payload.items.map((item) => ({
      pharmacy: payload.pharmacyReference,
      product: item.productReference,
      quantity: item.quantity,
    })),
  };

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + "/api/sales/", {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de créer la facture."));
  }

  return data as CreatedSale;
}

export function saveSaleDraft(pharmacyId: string, draft: SaleDraftStorage) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SALE_DRAFT_KEY_PREFIX + pharmacyId, JSON.stringify(draft));
}

export function getSavedSaleDraft(pharmacyId: string): SaleDraftStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(SALE_DRAFT_KEY_PREFIX + pharmacyId);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as SaleDraftStorage;
  } catch {
    return null;
  }
}

export function clearSaleDraft(pharmacyId: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SALE_DRAFT_KEY_PREFIX + pharmacyId);
}

function normalizeSaleProduct(product: ProductSummary): SaleProduct {
  return {
    reference: product.reference,
    name: product.name,
    form: product.form,
    dosage: product.strength,
    salePrice: product.salePrice,
    availableStock: product.currentStock,
  };
}

function parseJsonResponse(responseText: string) {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

function getApiErrorMessage(data: unknown, fallbackMessage: string): string {
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return fallbackMessage;
  }

  const record = data as Record<string, unknown>;
  const detail = record.detail;
  if (typeof detail === "string") {
    return detail;
  }

  const messages: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    if (typeof value === "string") {
      messages.push(field + ": " + value);
    } else if (Array.isArray(value)) {
      messages.push(field + ": " + value.join(", "));
    } else if (value && typeof value === "object") {
      messages.push(field + ": " + JSON.stringify(value));
    }
  }

  return messages.length ? messages.join(" | ") : fallbackMessage;
}

function calculateDiscountAmount(subtotal: number, type: DiscountType, value: number): number {
  if (type === "none") {
    return 0;
  }

  if (type === "percent") {
    return Math.min(subtotal, Math.max(0, subtotal * (value / 100)));
  }

  return Math.min(subtotal, Math.max(0, value));
}
