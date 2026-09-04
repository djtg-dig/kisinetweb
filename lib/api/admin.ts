import { apiFetch } from "@/lib/api/request";
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

export type AdminPharmacyDocument = {
  id: number;
  document_type: string;
  document_type_display: string;
  title: string;
  document_number: string;
  file: string;
  issued_at: string | null;
  expires_at: string | null;
  issuing_authority: string;
  verification_status: string;
  verification_status_display: string;
  verification_note: string;
  verified_at: string | null;
  verified_by_email: string | null;
  is_active: boolean;
  is_expired: boolean;
  download_url: string;
  created_at: string;
  updated_at: string;
};

export type AdminPharmacySubscription = {
  reference: string;
  plan_code: string;
  plan_name: string;
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
};

export type AdminPharmacyDetail = {
  id: number;
  reference: string;
  name: string;
  slug: string;
  email: string;
  phone_number: string;
  devise: string;
  owner_id: string;
  owner_reference: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_phone_number: string | null;
  owner_is_active: boolean;
  owner_is_staff: boolean;
  owner_date_joined: string;
  owner_last_login: string | null;
  invited_by_id: string | null;
  invited_by_reference: string | null;
  invited_by_email: string | null;
  address_id: number;
  address_country: string;
  address_country_iso2: string;
  address_country_phone_code: string;
  address_city_or_province: string;
  address_neighborhood: string;
  address_street: string;
  address_complement: string;
  address_postal_code: string;
  address_proximite_transports: string;
  address_formatted_address: string;
  address_latitude: string | null;
  address_longitude: string | null;
  members_count: number;
  active_members_count: number;
  documents: AdminPharmacyDocument[];
  subscription: AdminPharmacySubscription | null;
  is_archived_at: string | null;
  created_at: string;
  updated_at: string;
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
  currency?: string | null;
  category?: number | { id: number; name?: string; code?: string } | null;
  description?: string | null;
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

// Données transmises à l'API pour créer ou mettre à jour un fournisseur.
// Hypothèse de schéma (backend non présent dans le repo) : country = code ISO2,
// currency = code de devise, category = id de catégorie. À confirmer contre le
// sérialiseur Django si le comportement diffère.
export type AdminPaymentProviderInput = {
  country: string;
  currency: string;
  category: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  display_order?: number | null;
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
  payload: Partial<AdminPaymentProviderInput>,
): Promise<AdminPaymentProvider> {
  return fetchAdminJson<AdminPaymentProvider>(`/api/admin/payment-providers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Crée un nouveau fournisseur de paiement via l'API admin (POST).
export async function createAdminPaymentProvider(
  payload: AdminPaymentProviderInput,
): Promise<AdminPaymentProvider> {
  return fetchAdminJson<AdminPaymentProvider>("/api/admin/payment-providers/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Supprime un fournisseur de paiement depuis l'interface admin.
export async function deleteAdminPaymentProvider(id: number): Promise<void> {
  await fetchAdminJson<void>(`/api/admin/payment-providers/${id}/`, {
    method: "DELETE",
  });
}

// Devise telle que retournée par l'API publique des devises.
export type AdminPaymentCurrency = {
  id: number;
  code: string;
  name: string;
  symbol?: string;
  decimal_places?: number;
  is_active?: boolean;
};

// Charge la liste des devises (endpoint public). Aucune devise n'est codée en dur.
export async function getAdminPaymentCurrencies(): Promise<AdminPaymentCurrency[]> {
  const data = await fetchAdminJson<
    AdminPaymentCurrency[] | { results?: AdminPaymentCurrency[] }
  >("/api/paiements/currencies/");

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.results) ? data.results : [];
}

// Option de pays issue de l'API des pays (utilisée pour le champ "pays").
export type AdminCountryOption = {
  id: number;
  name: string;
  iso2: string;
  phoneCode: string;
};

// Convertit une URL (absolue ou relative) renvoyée par la pagination en chemin
// d'API relatif à apiBaseUrl, utilisable par fetchAdminJson.
function countryPagePath(url: string): string {
  try {
    const parsed = new URL(url, apiBaseUrl);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

// Charge la liste des pays depuis l'API. Aucun pays n'est codé en dur.
// L'endpoint peut renvoyer un tableau simple ou un objet paginé
// ({ count, next, previous, results }). On suit le lien `next` pour charger
// la liste complète même si le backend utilise une pagination serveur.
export async function getAdminCountries(): Promise<AdminCountryOption[]> {
  const collected: unknown[] = [];
  let path: string | null = "/api/pharmacies/countries/";

  while (path) {
    const data = await fetchAdminJson<unknown>(path);

    if (Array.isArray(data)) {
      collected.push(...data);
      break;
    }

    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (Array.isArray(record.results)) {
        collected.push(...record.results);
        const next = typeof record.next === "string" ? record.next : null;
        path = next ? countryPagePath(next) : null;
        continue;
      }
    }

    break;
  }

  return collected
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name || ""),
      iso2: String(item.iso2 || ""),
      phoneCode: String(item.phone_code || ""),
    }))
    .filter((country) => country.id && country.name);
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

// ---------------------------------------------------------------------------
// Comptes de paiement utilisateurs (admin)
//
// Deux bases de routes sont utilisées :
// - /api/admin/user-payment-accounts/            -> lecture seule (liste filtrable + détail)
// - /api/admin/user-payment-accounts-management/ -> gestion complète (CRUD, activate/deactivate)
//
// Les fonctions de cette section couvrent les DEUX aspects. La page détail est
// en lecture seule stricte ; la page de gestion ajoute création, modification,
// activation/désactivation et suppression.
// ---------------------------------------------------------------------------

// Compte de paiement d'un utilisateur tel que retourné par l'API admin.
// `user` est l'UUID du propriétaire, `provider` l'identifiant du fournisseur.
// Les champs `currency*` sont dérivés du fournisseur par le backend.
export type AdminUserPaymentAccount = {
  id: number;
  user: string;
  provider: number;
  currency: number | null;
  currency_code: string | null;
  currency_name: string | null;
  account_identifier: string;
  account_name: string;
  is_default: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Données transmises à l'API pour créer ou mettre à jour un compte.
// `user` = UUID de l'utilisateur, `provider` = id du fournisseur.
export type AdminUserPaymentAccountInput = {
  user: string;
  provider: number;
  account_identifier: string;
  account_name?: string;
  is_active?: boolean;
  is_default?: boolean;
};

// Charge les comptes de paiement de tous les utilisateurs (lecture seule).
// - `search` est envoyé au backend qui cherche dans le numéro de compte
//   (`account_identifier`) et le titulaire (`account_name`) ;
// - `isActive` vaut "true", "false" ou "" (aucun filtre).
// L'endpoint renvoie aujourd'hui un tableau simple ; le format paginé
// ({ results: [...] }) est également accepté pour rester compatible si le
// backend active la pagination plus tard.
export async function getAdminUserPaymentAccounts({
  search = "",
  isActive = "",
}: {
  search?: string;
  isActive?: string;
} = {}): Promise<AdminUserPaymentAccount[]> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (isActive.trim()) {
    params.set("is_active", isActive.trim());
  }

  const query = params.toString();
  const data = await fetchAdminJson<
    AdminUserPaymentAccount[] | { results?: AdminUserPaymentAccount[] }
  >("/api/admin/user-payment-accounts/" + (query ? "?" + query : ""));

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.results) ? data.results : [];
}

// Charge le détail d'un compte de paiement utilisateur (lecture seule).
export async function getAdminUserPaymentAccount(
  id: string,
): Promise<AdminUserPaymentAccount> {
  return fetchAdminJson<AdminUserPaymentAccount>(
    "/api/admin/user-payment-accounts/" + encodeURIComponent(id) + "/",
  );
}

// ---------------------------------------------------------------------------
// Gestion des comptes de paiement (admin) — routes /user-payment-accounts-management/
// ---------------------------------------------------------------------------

const adminUserPaymentAccountsManagementPath = "/api/admin/user-payment-accounts-management/";

// Normalise la réponse (tableau simple ou objet paginé { results: [...] }).
function normalizeAccountsPayload(
  data: AdminUserPaymentAccount[] | { results?: AdminUserPaymentAccount[] },
): AdminUserPaymentAccount[] {
  if (Array.isArray(data)) {
    return data;
  }
  return Array.isArray(data.results) ? data.results : [];
}

// Liste complète des comptes (gestion). Renvoie tous les comptes, actifs et
// inactifs, car cette page permet aussi l'activation/désactivation.
export async function getAdminUserPaymentAccountsManagement(): Promise<AdminUserPaymentAccount[]> {
  const data = await fetchAdminJson<
    AdminUserPaymentAccount[] | { results?: AdminUserPaymentAccount[] }
  >(adminUserPaymentAccountsManagementPath);
  return normalizeAccountsPayload(data);
}

// Crée un compte de paiement (POST).
export async function createAdminUserPaymentAccount(
  payload: AdminUserPaymentAccountInput,
): Promise<AdminUserPaymentAccount> {
  return fetchAdminJson<AdminUserPaymentAccount>(adminUserPaymentAccountsManagementPath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Met à jour intégralement un compte (PUT).
export async function updateAdminUserPaymentAccount(
  id: number,
  payload: AdminUserPaymentAccountInput,
): Promise<AdminUserPaymentAccount> {
  return fetchAdminJson<AdminUserPaymentAccount>(
    adminUserPaymentAccountsManagementPath + encodeURIComponent(String(id)) + "/",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

// Met à jour partiellement un compte (PATCH).
export async function patchAdminUserPaymentAccount(
  id: number,
  payload: Partial<AdminUserPaymentAccountInput>,
): Promise<AdminUserPaymentAccount> {
  return fetchAdminJson<AdminUserPaymentAccount>(
    adminUserPaymentAccountsManagementPath + encodeURIComponent(String(id)) + "/",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

// Supprime un compte (DELETE).
export async function deleteAdminUserPaymentAccount(id: number): Promise<void> {
  await fetchAdminJson<void>(
    adminUserPaymentAccountsManagementPath + encodeURIComponent(String(id)) + "/",
    { method: "DELETE" },
  );
}

// Active un compte via l'action dédiée du backend.
export async function activateAdminUserPaymentAccount(id: number): Promise<AdminUserPaymentAccount> {
  return fetchAdminJson<AdminUserPaymentAccount>(
    adminUserPaymentAccountsManagementPath +
      encodeURIComponent(String(id)) +
      "/activate/",
    { method: "POST" },
  );
}

// Désactive un compte via l'action dédiée du backend.
// Le backend refuse la désactivation d'un compte défini comme principal :
// l'erreur renvoyée est affichée telle quelle dans le toast.
export async function deactivateAdminUserPaymentAccount(
  id: number,
): Promise<AdminUserPaymentAccount> {
  return fetchAdminJson<AdminUserPaymentAccount>(
    adminUserPaymentAccountsManagementPath +
      encodeURIComponent(String(id)) +
      "/deactivate/",
    { method: "POST" },
  );
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await fetch("/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Identifiants invalides.");
  }

  const data = await response.json();
  return { access: "", refresh: "", admin: data.admin };
}

export async function getAdminSession(): Promise<AdminSession> {
  const response = await fetch("/api/auth/admin/session", {
    cache: "no-store",
    credentials: "include",
  });
  const data = await response.json();
  return { authenticated: data.authenticated, admin: data.admin };
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

// Charge l'annuaire complet des utilisateurs en suivant la pagination admin
// (20 utilisateurs par page côté backend).
// Objectif : afficher un email lisible à la place de l'UUID `user` renvoyé par
// certaines API admin. Le nombre de pages est plafonné pour éviter une boucle
// d'appels illimitée si le backend renvoie toujours un lien `next`.
export async function getAdminUsersDirectory(maxPages = 25): Promise<AdminProfile[]> {
  const users: AdminProfile[] = [];
  let page = 1;

  while (page <= maxPages) {
    const data = await getAdminUsers({ page });
    users.push(...data.results);

    if (!data.next) {
      break;
    }

    page += 1;
  }

  return users;
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

export async function getAdminPharmacy(pharmacyId: string): Promise<AdminPharmacyDetail> {
  return fetchAdminJson<AdminPharmacyDetail>(
    "/api/admin/pharmacies/" + encodeURIComponent(pharmacyId) + "/",
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
  try {
    await fetch("/api/auth/admin/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best effort logout
  }
}

export async function fetchAdminJson<T>(
  path: string,
  options: RequestInit & { includeAuth?: boolean } = {},
): Promise<T> {
  const { includeAuth = true, ...init } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
  };

  const response = await apiFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    credentials: includeAuth ? "include" : "omit",
    ...init,
    headers: {
      ...headers,
      ...init.headers,
    },
  });
  const responseText = await response.text();
  const data = parseJson(responseText);

  if (!response.ok && response.status === 403 && includeAuth) {
    throw new Error("Vous n'avez pas l'autorisation d'effectuer cette action.");
  }

  if (!response.ok && response.status === 401 && includeAuth) {
    throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
  }

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
