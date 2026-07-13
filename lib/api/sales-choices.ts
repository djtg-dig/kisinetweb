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

export async function refreshSalesChoices(): Promise<SalesChoices> {
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
}

async function fetchSalesChoiceList(path: string): Promise<SalesChoiceOption[]> {
  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
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
