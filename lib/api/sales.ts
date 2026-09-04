import { apiFetch } from "@/lib/api/request";
import {
  getAccountProfile,
  getPharmacyProducts,
  type AccountProfile,
  type ProductSummary,
} from "@/lib/api";
import { apiBaseUrl } from "@/lib/carri-account";
import { ApiError } from "./errors";

// Renvoie le code d'erreur API éventuel porté par la réponse backend.
function extractErrorCode(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const code = (data as Record<string, unknown>).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}

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

export type DetectedMedication = {
  rawName: string;
  strength: string | null;
  prescribedQuantity: string | null;
  readingScore: number;
};

export type PrescriptionAnalysis = {
  imageReadingScore: number;
  prescriptionReadingScore: number;
  medications: DetectedMedication[];
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

export async function analyzePrescription(
  pharmacyId: string,
  image: Blob,
  signal?: AbortSignal,
): Promise<DetectedMedication[]> {
  const form = new FormData();
  form.append("pharmacy_reference", pharmacyId);
  form.append("image", image);

  const response = await apiFetch(apiBaseUrl.replace(/\/$/, "") + "/api/sales/vision/", {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    body: form,
    signal,
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(data, "Impossible d'analyser l'ordonnance."),
      extractErrorCode(data),
      response.status,
    );
  }

  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const medications = Array.isArray(record.medications) ? record.medications : [];

  return medications
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      rawName: typeof item.raw_name === "string" ? item.raw_name : "",
      strength: typeof item.strength === "string" ? item.strength : null,
      prescribedQuantity:
        typeof item.prescribed_quantity === "string" ? item.prescribed_quantity : null,
      readingScore: typeof item.reading_score === "number" ? item.reading_score : 0,
    }));
}

export async function uploadPrescriptionCapture(
  pharmacyId: string,
  image: Blob,
): Promise<void> {
  const form = new FormData();
  form.append("pharmacy", pharmacyId);
  form.append("image", image);

  const response = await apiFetch(
    apiBaseUrl.replace(/\/$/, "") + "/api/sales/prescription-captures/",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      body: form,
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body ? " | Détail backend: " + body : "";
    // 4xx : service de capture indisponible (ex. stockage Cloudinary) ;
    // non bloquant pour la vente -> simple avertissement.
    // 5xx : erreur serveur inattendue -> erreur console.
    if (response.status >= 500) {
      console.error(
        "Prescription capture upload failed with status:",
        response.status,
        detail,
      );
    } else {
      console.warn(
        "Prescription capture upload ignored (status:",
        response.status + ")",
        detail,
      );
    }
  }
}

export async function createSale(payload: CreateSalePayload): Promise<CreatedSale> {
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

  const response = await apiFetch(apiBaseUrl.replace(/\/$/, "") + "/api/sales/", {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(data, "Impossible de créer la facture."),
      extractErrorCode(data),
      response.status,
    );
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
