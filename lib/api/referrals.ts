import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type ReferralWalletSummary = {
  currency: string;
  earned_total: string;
  pending_balance: string;
  available_balance: string;
  reserved_balance: string;
  withdrawn_total: string;
  reversed_total: string;
  commissions_count: number;
  pending_withdrawals_count: number;
};

export type ReferralWallet = {
  id: number;
  owner_reference: string;
  currency: string;
  earned_total: string;
  pending_balance: string;
  available_balance: string;
  reserved_balance: string;
  withdrawn_total: string;
  reversed_total: string;
};

export type ReferredPharmacy = {
  id: number;
  pharmacy_reference: string;
  pharmacy_name: string;
  referrer_reference: string;
  referral_code: string;
  status: string;
  created_at: string;
};

export type ReferralCommission = {
  id: number;
  pharmacy_reference: string;
  payment_reference: string;
  eligible_amount: string;
  commission_rate: string;
  commission_amount: string;
  currency: string;
  status: string;
  available_at: string | null;
  created_at: string;
};

export type ReferralWalletTransaction = {
  reference: string;
  transaction_type: string;
  amount: string;
  currency: string;
  withdrawal_reference: string;
  description: string;
  created_at: string;
};

export type ReferralWithdrawal = {
  reference: string;
  amount: string;
  currency: string;
  payment_method: string;
  destination_snapshot: Record<string, unknown>;
  status: string;
  provider_reference: string;
  rejection_reason: string;
  requested_at: string;
  processing_at: string | null;
  paid_at: string | null;
};

export type CreateReferralWithdrawalPayload = {
  amount: string;
  currency: string;
  payment_method: string;
  destination: {
    operator?: string;
    phone_number?: string;
    account_name?: string;
    [key: string]: string | undefined;
  };
};

export async function getReferralOverview(): Promise<ReferralWalletSummary[]> {
  return fetchReferralJson<ReferralWalletSummary[]>("/api/paiements/referrals/me/");
}

export async function getReferredPharmacies(): Promise<ReferredPharmacy[]> {
  return fetchReferralJson<ReferredPharmacy[]>("/api/paiements/referrals/referred-pharmacies/");
}

export async function getReferralWallets(): Promise<ReferralWallet[]> {
  return fetchReferralJson<ReferralWallet[]>("/api/paiements/referral-wallets/");
}

export async function getReferralWalletSummary(currency: string): Promise<ReferralWalletSummary> {
  return fetchReferralJson<ReferralWalletSummary>(
    "/api/paiements/referral-wallets/" + encodeURIComponent(currency.toUpperCase()) + "/summary/",
  );
}

export async function getReferralWalletTransactions(
  currency: string,
): Promise<ReferralWalletTransaction[]> {
  return fetchReferralJson<ReferralWalletTransaction[]>(
    "/api/paiements/referral-wallets/" + encodeURIComponent(currency.toUpperCase()) + "/transactions/",
  );
}

export async function getReferralCommissions(currency?: string): Promise<ReferralCommission[]> {
  const params = new URLSearchParams();
  if (currency) {
    params.set("currency", currency.toUpperCase());
  }
  const suffix = params.toString() ? "?" + params.toString() : "";
  return fetchReferralJson<ReferralCommission[]>("/api/paiements/referral-commissions/" + suffix);
}

export async function getReferralWithdrawals(): Promise<ReferralWithdrawal[]> {
  return fetchReferralJson<ReferralWithdrawal[]>("/api/paiements/referral-withdrawals/");
}

export async function createReferralWithdrawal(
  payload: CreateReferralWithdrawalPayload,
): Promise<ReferralWithdrawal> {
  return fetchReferralJson<ReferralWithdrawal>("/api/paiements/referral-withdrawals/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function fetchReferralJson<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  const data = parseJson(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de charger le parrainage."));
  }

  return data as T;
}

function parseJson(value: string): unknown {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") {
    return record.detail;
  }

  const firstValue = Object.values(record)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
    return firstValue[0];
  }

  if (typeof firstValue === "string") {
    return firstValue;
  }

  return fallback;
}
