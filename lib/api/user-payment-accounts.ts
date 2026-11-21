import { ApiAuthError } from "@/lib/api";
import { apiFetch } from "@/lib/api/request";
import { apiBaseUrl } from "@/lib/carri-account";

export type MobileMoneyProvider = {
  id: number;
  code: string;
  name: string;
  logo: string;
};

export type UserPaymentAccount = {
  id: number;
  mobileMoneyProvider: number | null;
  bankProvider: number | null;
  accountIdentifierMasked: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPaymentAccountPayload = {
  mobileMoneyProvider?: number | null;
  accountIdentifier?: string;
  accountName?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export type ReferralWithdrawalQuote = {
  quoteToken: string;
  expiresInSeconds: number;
  availableBalance: string;
  totalDebited: string;
  netPayout: string;
  feeAmount: string;
  minimumAmount: string;
  maximumAmount: string | null;
};

type UnknownRecord = Record<string, unknown>;

export async function getMobileMoneyProviders(): Promise<MobileMoneyProvider[]> {
  const data = await fetchJson<unknown>("/api/payment/mobile-money/providers/");
  const rows = Array.isArray(data) ? data : getRows(data);

  return rows.map(normalizeMobileMoneyProvider).filter((provider) => provider.id > 0);
}

export async function getUserPaymentAccounts(): Promise<UserPaymentAccount[]> {
  const data = await fetchJson<unknown>("/api/user-payment-accounts/");
  const rows = Array.isArray(data) ? data : getRows(data);

  return rows.map(normalizeUserPaymentAccount).filter((account) => account.id > 0);
}

export async function createUserPaymentAccount(
  payload: Required<Pick<UserPaymentAccountPayload, "mobileMoneyProvider" | "accountIdentifier">> & UserPaymentAccountPayload,
): Promise<UserPaymentAccount> {
  const data = await fetchJson<unknown>("/api/user-payment-accounts/", {
    method: "POST",
    body: JSON.stringify(toPayload(payload)),
  });

  return normalizeUserPaymentAccount(data);
}

export async function updateUserPaymentAccount(
  id: number,
  payload: UserPaymentAccountPayload,
): Promise<UserPaymentAccount> {
  const data = await fetchJson<unknown>("/api/user-payment-accounts/" + id + "/", {
    method: "PATCH",
    body: JSON.stringify(toPayload(payload)),
  });

  return normalizeUserPaymentAccount(data);
}

export async function setDefaultUserPaymentAccount(id: number): Promise<UserPaymentAccount> {
  const data = await fetchJson<unknown>("/api/user-payment-accounts/" + id + "/set-default/", {
    method: "POST",
  });

  return normalizeUserPaymentAccount(data);
}

export async function getReferralWithdrawalQuote(input: {
  amount: string;
  currency: string;
  country: string;
  userPaymentAccountId: number;
}): Promise<ReferralWithdrawalQuote> {
  const data = await fetchJson<unknown>("/api/paiements/referral-withdrawals/quote/", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      country: input.country,
      payment_method: "MOBILE_MONEY",
      user_payment_account_id: input.userPaymentAccountId,
    }),
  });
  const record = asRecord(data);

  return {
    quoteToken: asText(record?.quote_token),
    expiresInSeconds: asNumber(record?.expires_in_seconds),
    availableBalance: asText(record?.available_balance),
    totalDebited: asText(record?.total_debited),
    netPayout: asText(record?.net_payout),
    feeAmount: asText(record?.fee_amount),
    minimumAmount: asText(record?.minimum_amount),
    maximumAmount: record?.maximum_amount == null ? null : asText(record.maximum_amount),
  };
}

export async function confirmReferralWithdrawalQuote(input: {
  quoteToken: string;
  userPaymentAccountId: number;
}): Promise<{ reference: string; status: string }> {
  const data = await fetchJson<unknown>("/api/paiements/referral-withdrawals/confirm-quote/", {
    method: "POST",
    body: JSON.stringify({
      quote_token: input.quoteToken,
      user_payment_account_id: input.userPaymentAccountId,
    }),
  });
  const record = asRecord(data);

  return { reference: asText(record?.reference), status: asText(record?.status) };
}

function toPayload(payload: UserPaymentAccountPayload) {
  return {
    ...(payload.mobileMoneyProvider !== undefined ? { mobile_money_provider: payload.mobileMoneyProvider } : {}),
    ...(payload.accountIdentifier !== undefined ? { account_identifier: payload.accountIdentifier } : {}),
    ...(payload.accountName !== undefined ? { account_name: payload.accountName } : {}),
    ...(payload.isDefault !== undefined ? { is_default: payload.isDefault } : {}),
    ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
  };
}

function normalizeMobileMoneyProvider(value: unknown): MobileMoneyProvider {
  const record = asRecord(value);
  return {
    id: asNumber(record?.id),
    code: asText(record?.code),
    name: asText(record?.name),
    logo: asText(record?.logo),
  };
}

function normalizeUserPaymentAccount(value: unknown): UserPaymentAccount {
  const record = asRecord(value);
  return {
    id: asNumber(record?.id),
    mobileMoneyProvider: asNullableNumber(record?.mobile_money_provider),
    bankProvider: asNullableNumber(record?.bank_provider),
    accountIdentifierMasked: asText(record?.account_identifier_masked),
    accountName: asText(record?.account_name),
    isDefault: Boolean(record?.is_default),
    isVerified: Boolean(record?.is_verified),
    isActive: Boolean(record?.is_active),
    createdAt: asText(record?.created_at),
    updatedAt: asText(record?.updated_at),
  };
}

function getRows(value: unknown): unknown[] {
  const record = asRecord(value);
  return Array.isArray(record?.results) ? record.results : [];
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function asNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asNullableNumber(value: unknown): number | null {
  return value == null ? null : asNumber(value);
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiAuthError();
    }
    throw new Error(getErrorMessage(data, "Impossible de gérer les comptes de retrait."));
  }

  return data as T;
}

function parseJson(value: string): unknown {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  const record = asRecord(data);
  if (!record) {
    return fallback;
  }
  if (typeof record.detail === "string") {
    return record.detail;
  }
  const firstValue = Object.values(record)[0];
  return Array.isArray(firstValue) && typeof firstValue[0] === "string"
    ? firstValue[0]
    : typeof firstValue === "string" ? firstValue : fallback;
}
