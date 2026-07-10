import {
  getAccountProfile,
  getPharmacyProducts,
  type AccountProfile,
  type ProductSummary,
} from "@/lib/api";

export type PaymentMethod = "cash" | "mobile_money" | "card" | "other";

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
    address?: string;
    reference?: string;
  };
  prescription?: {
    prescriberName?: string;
    reference?: string;
    prescribedAt?: string;
  };
  discount?: {
    type: DiscountType;
    value: number;
    reason?: string;
  };
  payment: {
    method: PaymentMethod;
    receivedAmount: number;
  };
};

export type SaleDraftStorage = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerReference: string;
  prescriptionMode: "none" | "image";
  prescriberName: string;
  prescriptionReference: string;
  prescriptionDate: string;
  discountType: DiscountType;
  discountValue: string;
  discountReason: string;
  paymentMethod: PaymentMethod;
  receivedAmount: string;
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

export async function createSale(_payload: CreateSalePayload): Promise<never> {
  throw new Error("La validation backend de la vente sera ajoutée ultérieurement.");
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
    salePrice: product.salePrice,
    availableStock: product.currentStock,
  };
}
