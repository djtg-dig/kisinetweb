import {
  clearAdminTokens,
  getAdminAccessToken,
  getAdminRefreshToken,
  saveAdminTokens,
} from "@/lib/admin/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type AdminProfile = {
  id: string;
  reference: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  updated_at: string;
  groups: string[];
  user_permissions: string[];
};

export type AdminSession = {
  authenticated: boolean;
  admin: AdminProfile;
};

export type AdminLoginResponse = {
  access: string;
  refresh: string;
  admin: AdminProfile;
};

export type AdminUsersPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminProfile[];
};

export type AdminReferralWithdrawal = {
  reference: string;
  requester_email: string;
  requester_reference: string;
  amount: string;
  currency: string;
  payout_account_reference: string;
  payment_method: string;
  destination_snapshot: Record<string, unknown>;
  status: string;
  provider_reference: string;
  rejection_reason: string;
  requested_at: string;
  processing_at: string | null;
  paid_at: string | null;
};

export type AdminReferralWithdrawalsPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminReferralWithdrawal[];
};

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const data = await fetchAdminJson<AdminLoginResponse>("/api/admin/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    includeAuth: false,
  });
  saveAdminTokens(data.access, data.refresh);
  return data;
}

export async function getAdminSession(): Promise<AdminSession> {
  return fetchAdminJson<AdminSession>("/api/admin/auth/me/");
}

export async function getAdminUsers({
  search = "",
  page = 1,
}: {
  search?: string;
  page?: number;
} = {}): Promise<AdminUsersPage> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return fetchAdminJson<AdminUsersPage>(
    "/api/admin/users/" + (params.toString() ? "?" + params.toString() : ""),
  );
}

export async function getAdminReferralWithdrawals({
  search = "",
  page = 1,
  status = "",
  currency = "",
}: {
  search?: string;
  page?: number;
  status?: string;
  currency?: string;
} = {}): Promise<AdminReferralWithdrawalsPage> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (status.trim()) {
    params.set("status", status.trim());
  }
  if (currency.trim()) {
    params.set("currency", currency.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return fetchAdminJson<AdminReferralWithdrawalsPage>(
    "/api/admin/referral-withdrawals/" + (params.toString() ? "?" + params.toString() : ""),
  );
}

export async function transitionAdminReferralWithdrawal(
  reference: string,
  action: "processing" | "paid" | "reject" | "failed",
  payload: {
    provider_reference?: string;
    reason?: string;
    provider_metadata?: Record<string, unknown>;
  } = {},
): Promise<AdminReferralWithdrawal> {
  return fetchAdminJson<AdminReferralWithdrawal>(
    "/api/admin/referral-withdrawals/" +
      encodeURIComponent(reference) +
      "/" +
      encodeURIComponent(action) +
      "/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function logoutAdmin() {
  const refresh = getAdminRefreshToken();
  try {
    if (refresh) {
      await fetchAdminJson<{ detail: string }>("/api/admin/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    }
  } finally {
    clearAdminTokens();
  }
}

async function fetchAdminJson<T>(
  path: string,
  options: RequestInit & { includeAuth?: boolean } = {},
): Promise<T> {
  const { includeAuth = true, ...init } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
  };
  const accessToken = getAdminAccessToken();

  if (includeAuth) {
    if (!accessToken) {
      throw new Error("Session administrateur introuvable.");
    }
    headers.Authorization = "Bearer " + accessToken;
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    ...init,
    headers: {
      ...headers,
      ...init.headers,
    },
  });
  const responseText = await response.text();
  const data = parseJson(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Action administrateur impossible."));
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
