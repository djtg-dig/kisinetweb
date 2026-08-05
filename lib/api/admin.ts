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

export type AdminPharmacy = {
  id: number;
  reference: string;
  name: string;
  devise: string;
  slug: string;
  email: string;
  phone_number: string;
  owner_id: string;
  owner_reference: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  invited_by_id: string | null;
  invited_by_reference: string | null;
  invited_by_email: string | null;
  address_id: number;
  country: string;
  country_phone_code: string;
  city_or_province: string;
  neighborhood: string;
  street: string;
  complement_adresse: string;
  postal_code: string;
  proximite_transports: string;
  formatted_address: string;
  latitude: string | null;
  longitude: string | null;
  members_count: number;
  active_members_count: number;
  is_archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPharmaciesPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminPharmacy[];
};

export type AdminSubscription = {
  id: number;
  reference: string;
  pharmacy_id: number;
  pharmacy_reference: string;
  pharmacy_name: string;
  pharmacy_devise: string;
  pharmacy_email: string;
  pharmacy_phone_number: string;
  owner_id: string;
  owner_reference: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  plan_code: string;
  plan_name: string;
  plan_monthly_price: string;
  plan_currency: string;
  status: string;
  duration_months: number;
  discount_percentage: string;
  total_amount: string;
  starts_at: string;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  is_trial_active: boolean;
  is_active: boolean;
  payments_count: number;
  last_payment_reference: string | null;
  last_payment_status: string | null;
  last_payment_amount: string | null;
  last_payment_currency: string | null;
  last_payment_paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminSubscriptionsPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminSubscription[];
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

export type AdminPaymentProvider = {
  id: number;
  name?: string;
  code?: string;
  slug?: string;
  display_name?: string;
  country?: string | null;
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AdminPaymentProvidersResponse =
  | AdminPaymentProvider[]
  | {
      count?: number;
      next?: string | null;
      previous?: string | null;
      results?: AdminPaymentProvider[];
    };

// Charge la liste des fournisseurs de paiement accessibles depuis l'interface admin.
export async function getAdminPaymentProviders(): Promise<AdminPaymentProvider[]> {
  const data = await fetchAdminJson<AdminPaymentProvidersResponse>(
    "/api/admin/payment-providers/",
  );

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.results) ? data.results : [];
}

// Met à jour partiellement un fournisseur de paiement via l'API admin.
export async function patchAdminPaymentProvider(
  id: number,
  payload: Partial<AdminPaymentProvider>,
): Promise<AdminPaymentProvider> {
  return fetchAdminJson<AdminPaymentProvider>(`/api/admin/payment-providers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Supprime un fournisseur de paiement depuis l'interface admin.
export async function deleteAdminPaymentProvider(id: number): Promise<void> {
  await fetchAdminJson<void>(`/api/admin/payment-providers/${id}/`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Catégories de paiement (admin)
// Base des routes : /api/paiements/admin/payment-categories/
// Aucune URL n'est codée en dur dans les composants : ils appellent ces
// fonctions pour déclencher les requêtes HTTP.
// ---------------------------------------------------------------------------

// Catégorie de paiement telle que retournée par l'API admin.
export type AdminPaymentCategory = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
};

// Données transmises à l'API pour créer ou mettre à jour une catégorie.
export type AdminPaymentCategoryInput = {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  display_order?: number | null;
};

const adminPaymentCategoriesPath = "/api/paiements/admin/payment-categories/";

// Charge la liste des catégories (supporte un tableau ou une réponse paginée).
export async function getAdminPaymentCategories(): Promise<AdminPaymentCategory[]> {
  const data = await fetchAdminJson<
    AdminPaymentCategory[] | { results?: AdminPaymentCategory[] }
  >(adminPaymentCategoriesPath);

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.results) ? data.results : [];
}

// Crée une nouvelle catégorie de paiement (POST).
export async function createAdminPaymentCategory(
  payload: AdminPaymentCategoryInput,
): Promise<AdminPaymentCategory> {
  return fetchAdminJson<AdminPaymentCategory>(adminPaymentCategoriesPath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Met à jour une catégorie (PATCH partiel) depuis l'interface admin.
export async function updateAdminPaymentCategory(
  id: number,
  payload: Partial<AdminPaymentCategoryInput>,
): Promise<AdminPaymentCategory> {
  return fetchAdminJson<AdminPaymentCategory>(`${adminPaymentCategoriesPath}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Supprime une catégorie. Aucune donnée associée n'est supprimée automatiquement.
export async function deleteAdminPaymentCategory(id: number): Promise<void> {
  await fetchAdminJson<void>(`${adminPaymentCategoriesPath}${id}/`, {
    method: "DELETE",
  });
}

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

export async function getAdminPharmacies({
  search = "",
  page = 1,
  devise = "",
  country = "",
  cityOrProvince = "",
  neighborhood = "",
  archived = "",
  hasEmail = "",
  hasPhone = "",
}: {
  search?: string;
  page?: number;
  devise?: string;
  country?: string;
  cityOrProvince?: string;
  neighborhood?: string;
  archived?: string;
  hasEmail?: string;
  hasPhone?: string;
} = {}): Promise<AdminPharmaciesPage> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (devise.trim()) {
    params.set("devise", devise.trim());
  }
  if (country.trim()) {
    params.set("country", country.trim());
  }
  if (cityOrProvince.trim()) {
    params.set("city_or_province", cityOrProvince.trim());
  }
  if (neighborhood.trim()) {
    params.set("neighborhood", neighborhood.trim());
  }
  if (archived.trim()) {
    params.set("archived", archived.trim());
  }
  if (hasEmail.trim()) {
    params.set("has_email", hasEmail.trim());
  }
  if (hasPhone.trim()) {
    params.set("has_phone", hasPhone.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return fetchAdminJson<AdminPharmaciesPage>(
    "/api/admin/pharmacies/" + (params.toString() ? "?" + params.toString() : ""),
  );
}

export async function getAdminSubscriptions({
  search = "",
  page = 1,
  reference = "",
  planCode = "",
  status = "",
}: {
  search?: string;
  page?: number;
  reference?: string;
  planCode?: string;
  status?: string;
} = {}): Promise<AdminSubscriptionsPage> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (reference.trim()) {
    params.set("reference", reference.trim());
  }
  if (planCode.trim()) {
    params.set("plan_code", planCode.trim());
  }
  if (status.trim()) {
    params.set("status", status.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return fetchAdminJson<AdminSubscriptionsPage>(
    "/api/admin/subscriptions/" + (params.toString() ? "?" + params.toString() : ""),
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
