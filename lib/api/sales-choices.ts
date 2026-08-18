import { apiFetch } from "@/lib/api/request";
import { dedupeRequest } from "@/lib/api-request-cache";
import { apiBaseUrl } from "@/lib/carri-account";

export type SalesChoiceOption = {
  value: string;
  label: string;
};

export type SalesChoices = {
  paymentMethods: SalesChoiceOption[];
  paymentStatuses: SalesChoiceOption[];
  saleStatuses: SalesChoiceOption[];
  updatedAt: string;
};

export const SALES_CHOICES_STORAGE_KEY = "kisinet_sales_choices";
const SALES_CHOICES_TTL_MS = 24 * 60 * 60 * 1000;

export async function refreshSalesChoices(): Promise<SalesChoices> {
  return dedupeRequest(
    "public:GET:sales-choices",
    async () => {
      const cachedChoices = readCachedSalesChoices();
      if (cachedChoices) {
        return cachedChoices;
      }

      const [paymentMethods, paymentStatuses, saleStatuses] = await Promise.all([
        fetchSalesChoiceList("/api/sales/payment-methods/"),
        fetchSalesChoiceList("/api/sales/payment-statuses/"),
        fetchSalesChoiceList("/api/sales/statuses/"),
      ]);

      const choices = {
        paymentMethods,
        paymentStatuses,
        saleStatuses,
        updatedAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(SALES_CHOICES_STORAGE_KEY, JSON.stringify(choices));
      }

      return choices;
    },
    { ttlMs: SALES_CHOICES_TTL_MS },
  );
}

async function fetchSalesChoiceList(path: string): Promise<SalesChoiceOption[]> {
  const response = await apiFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les options de vente.");
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isSalesChoiceOption);
}

function isSalesChoiceOption(value: unknown): value is SalesChoiceOption {
  if (!value || typeof value !== "object") {
    return false;
  }

  const option = value as { value?: unknown; label?: unknown };
  return typeof option.value === "string" && typeof option.label === "string";
}

function readCachedSalesChoices(): SalesChoices | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = localStorage.getItem(SALES_CHOICES_STORAGE_KEY);
    if (!value) {
      return null;
    }

    const choices = JSON.parse(value) as Partial<SalesChoices>;
    const updatedAt = choices.updatedAt ? new Date(choices.updatedAt).getTime() : 0;
    const isFresh = Number.isFinite(updatedAt) && Date.now() - updatedAt < SALES_CHOICES_TTL_MS;

    if (
      !isFresh ||
      !Array.isArray(choices.paymentMethods) ||
      !Array.isArray(choices.paymentStatuses) ||
      !Array.isArray(choices.saleStatuses)
    ) {
      return null;
    }

    return choices as SalesChoices;
  } catch {
    return null;
  }
}
