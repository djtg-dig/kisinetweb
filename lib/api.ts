import { getAccessToken, getRefreshToken } from "@/lib/auth";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth";
import { dedupeRequest } from "@/lib/api-request-cache";
import { apiBaseUrl } from "@/lib/carri-account";

export type PharmacySummary = {
  id: string;
  databaseId?: string;
  reference?: string;
  name: string;
  devise?: string;
  role?: string;
  status?: string;
  email?: string;
  phoneNumber?: string;
  addressLine?: string;
  country?: string;
  countryId?: string;
  cityOrProvince?: string;
  cityOrProvinceId?: string;
  neighborhood?: string;
  street?: string;
  latitude?: string;
  longitude?: string;
  planName?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
};

export type AccountProfile = {
  reference?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateJoined?: string;
  updatedAt?: string;
};

export type PharmacyActivity = {
  id: string;
  type: string;
  label: string;
  message: string;
  user?: string;
  createdAt?: string;
};

export type PharmacyAddress = {
  country?: string | number;
  countryId?: string;
  countryPhoneCode?: string;
  countryName?: string;
  cityOrProvince?: string | number;
  cityOrProvinceId?: string;
  cityOrProvinceName?: string;
  neighborhood?: string;
  street?: string;
  complementAdresse?: string;
  postalCode?: string;
  proximiteTransports?: string;
  formattedAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type PharmacyDetail = {
  id?: number;
  reference?: string;
  ownerReference?: string;
  ownerFullName?: string;
  invitedByReference?: string | null;
  name?: string;
  slug?: string;
  email?: string;
  phoneNumber?: string;
  devise?: string;
  address?: PharmacyAddress;
  subscription?: unknown;
  isArchivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdatePharmacyAddressInput = {
  country?: string;
  cityOrProvince?: string | number | null;
  neighborhood?: string;
  street?: string;
  complementAdresse?: string;
  postalCode?: string;
  proximiteTransports?: string;
  formattedAddress?: string;
};

export type UpdatePharmacyInput = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: UpdatePharmacyAddressInput;
};

export type CreatePharmacyInput = {
  name: string;
  email?: string;
  phoneNumber?: string;
  devise?: string;
  country: string;
  cityOrProvince?: string;
  street?: string;
  neighborhood?: string;
  // Code de parrainage facultatif : référence publique USXXXXXXXX du parrain,
  // et non son identifiant. Le champ est immuable après la création.
  invitedBy?: string;
};

export type CreatePharmacyJoinRequestInput = {
  pharmacy: string;
  requestedRole?: "MANAGER" | "PHARMACIST" | "EMPLOYEE";
  message?: string;
};

export type PharmacyJoinRequestSummary = {
  id?: number;
  pharmacy?: string;
  pharmacyName?: string;
  user?: string;
  userEmail?: string;
  requestedRole?: string;
  message?: string;
  status?: string;
  isSeen?: boolean;
  reviewerEmail?: string;
  reviewedAt?: string;
  createdAt?: string;
};

export type ProductSummary = {
  reference: string;
  pharmacyReference: string;
  name: string;
  description?: string;
  form?: string;
  targetGender?: string;
  targetAgeGroup?: string;
  therapeuticCategory?: string;
  strength?: string;
  package?: string;
  salePrice: number;
  purchasePrice?: number;
  currentStock: number;
  createdDate?: string | null;
  expirationDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginatedProducts = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductSummary[];
};

export type ProductFilters = {
  search?: string;
  reference?: string;
  name?: string;
  form?: string;
  targetGender?: string;
  targetAgeGroup?: string;
  therapeuticCategory?: string;
  strength?: string;
  package?: string;
  stockStatus?: string;
  minStock?: string;
  maxStock?: string;
  minSalePrice?: string;
  maxSalePrice?: string;
  minPurchasePrice?: string;
  maxPurchasePrice?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  ordering?: string;
  page?: string;
};

export type FilterOption = {
  value: string;
  label: string;
};

export type ProductFilterOptions = {
  forms: FilterOption[];
  targetGenders: FilterOption[];
  targetAgeGroups: FilterOption[];
  therapeuticCategories: FilterOption[];
  stockStatuses: FilterOption[];
  orderings: FilterOption[];
};

export type PharmacyPermissions = {
  pharmacy_view?: boolean;
  pharmacy_update?: boolean;
  pharmacy_delete?: boolean;
  member_view?: boolean;
  member_invite?: boolean;
  member_update?: boolean;
  member_suspend?: boolean;
  member_delete?: boolean;
  member_manage_permissions?: boolean;
  join_request_view?: boolean;
  join_request_accept?: boolean;
  join_request_reject?: boolean;
  product_view?: boolean;
  product_create?: boolean;
  product_update?: boolean;
  product_delete?: boolean;
  stock_view?: boolean;
  stock_adjust?: boolean;
  stock_transfer?: boolean;
  sale_view?: boolean;
  sale_create?: boolean;
  sale_payment_create?: boolean;
  sale_cancel?: boolean;
};

export type PharmacyMemberRole = "OWNER" | "MANAGER" | "PHARMACIST" | "EMPLOYEE";

export type PharmacyMember = {
  id: number;
  pharmacy: string;
  user: string;
  userEmail?: string;
  userFullName?: string;
  role: PharmacyMemberRole;
  isSuspended: boolean;
  permissions: PharmacyPermissions;
  joinedAt?: string;
};

export type UpdatePharmacyMemberInput = {
  role?: PharmacyMemberRole;
  isSuspended?: boolean;
};

export type CountryOption = {
  id: number;
  name: string;
  iso2: string;
  phoneCode: string;
};

export type CityOrProvinceOption = {
  id: number;
  country: number;
  countryPhoneCode: string;
  name: string;
  code?: string;
};

export type PublicPharmacyFilters = {
  search?: string;
  reference?: string;
  name?: string;
  country?: string;
  cityOrProvince?: string;
  neighborhood?: string;
  hasEmail?: string;
  hasPhone?: string;
  ordering?: string;
  page?: string;
};

export type PaginatedPublicPharmacies = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PharmacySummary[];
};

export type PublicPharmacyFilterOptions = {
  countries: FilterOption[];
  citiesOrProvinces: (FilterOption & { country?: string; countryName?: string })[];
  neighborhoods: FilterOption[];
  orderings: FilterOption[];
};

type UnknownRecord = Record<string, unknown>;

// ──────────────────────────────────────────────────
// Gestion du refresh token automatique
// ──────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessTokenIfNeeded(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(
        apiBaseUrl.replace(/\/$/, "") + "/api/accounts/token/refresh/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        },
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        if (data.refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
        }
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Erreur levée quand la session est invalidée (token absent, expiré ou refusé
// même après tentative de refresh). On expose un message clair et stable afin
// que l'interface puisse proposer une reconnexion à la place d'un message
// brut du backend (ex. « Given token not valid for any token type »).
export class ApiAuthError extends Error {
  constructor() {
    super("Votre session a expiré. Veuillez vous reconnecter.");
    this.name = "ApiAuthError";
  }
}

export async function authenticatedFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", "Bearer " + accessToken);

  let response = await fetch(input, {
    ...init,
    headers,
  });

  // En cas de 401, tenter un refresh du token puis rejouer la requete
  if (response.status === 401) {
    const refreshed = await refreshAccessTokenIfNeeded();
    if (refreshed) {
      const newToken = getAccessToken();
      headers.set("Authorization", "Bearer " + newToken);
      response = await fetch(input, {
        ...init,
        headers,
      });
    }
    // Le refresh a échoué ou le nouveau token est encore refusé : la session est
    // invalidée. On lève une erreur claire au lieu de renvoyer le message brut
    // de l'API (ex. « Given token not valid for any token type »).
    if (response.status === 401) {
      throw new ApiAuthError();
    }
  }

  return response;
}

function getText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

/**
 * Normalise une reponse de liste. Le backend renvoie soit un tableau brut,
 * soit une enveloppe paginee `{count, next, previous, results}` selon
 * l'endpoint : on accepte les deux formes.
 */
function toRecordList(value: unknown): UnknownRecord[] {
  const record = getRecord(value);
  const rows = Array.isArray(value) ? value : Array.isArray(record?.results) ? record.results : [];

  return rows.filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object");
}

function normalizePharmacy(item: UnknownRecord): PharmacySummary {
  const id = item.reference ?? item.id ?? item.pk;
  const databaseId = item.id ?? item.pk;
  const name = item.name ?? item.title ?? "Pharmacie sans nom";
  const address = getRecord(item.adresse);
  const country = getRecord(address?.country);
  const cityOrProvince = getRecord(address?.city_or_province);
  const subscription = getRecord(item.subscription);
  const addressParts = [
    getText(address?.formatted_address),
    getText(address?.street),
    getText(address?.neighborhood),
    getText(cityOrProvince?.name),
    getText(country?.name),
  ].filter(Boolean);

  return {
    id: String(id),
    databaseId:
      databaseId === undefined || databaseId === null ? undefined : String(databaseId),
    reference: getText(item.reference) ?? String(id),
    name: String(name),
    devise: getText(item.devise) ?? "USD",
    role: getText(item.role),
    status: getText(item.status) ?? getText(subscription?.status),
    email: getText(item.email),
    phoneNumber: getText(item.phone_number),
    addressLine: addressParts.join(", ") || undefined,
    country: getText(country?.name),
    countryId: country?.id === undefined ? undefined : String(country.id),
    cityOrProvince: getText(cityOrProvince?.name),
    cityOrProvinceId:
      cityOrProvince?.id === undefined ? undefined : String(cityOrProvince.id),
    neighborhood: getText(address?.neighborhood),
    street: getText(address?.street),
    latitude: address?.latitude === undefined || address?.latitude === null ? undefined : String(address.latitude),
    longitude: address?.longitude === undefined || address?.longitude === null ? undefined : String(address.longitude),
    planName: getText(subscription?.plan_name) ?? getText(subscription?.plan_code),
    subscriptionStatus: getText(subscription?.status),
    trialEndsAt: getText(subscription?.trial_ends_at),
  };
}

function normalizeAccountProfile(item: UnknownRecord): AccountProfile {
  return {
    reference: getText(item.reference),
    email: getText(item.email),
    firstName: getText(item.first_name),
    lastName: getText(item.last_name),
    phoneNumber: getText(item.phone_number),
    dateJoined: getText(item.date_joined),
    updatedAt: getText(item.updated_at),
  };
}

function normalizePharmacyActivity(item: UnknownRecord): PharmacyActivity {
  const type = getText(item.type) || "ACTIVITY";

  return {
    id: String(item.id || item.created_at || type),
    type,
    label: type.replaceAll("_", " "),
    message: getText(item.message) || "Activité enregistrée.",
    user: getText(item.user),
    createdAt: getText(item.created_at),
  };
}

function normalizePharmacyDetail(item: UnknownRecord): PharmacyDetail {
  const address = getRecord(item.adresse);
  const country = address?.country;
  const cityOrProvince = address?.city_or_province;
  const countryRecord = getRecord(country);
  const cityOrProvinceRecord = getRecord(cityOrProvince);
  const countryPhoneCode =
    getText(countryRecord?.phone_code) ||
    (country === undefined || country === null ? undefined : String(country));
  const cityOrProvinceId =
    cityOrProvinceRecord?.id === undefined || cityOrProvinceRecord?.id === null
      ? cityOrProvince === undefined || cityOrProvince === null
        ? undefined
        : String(cityOrProvince)
      : String(cityOrProvinceRecord.id);

  return {
    id:
      item.id === undefined || item.id === null ? undefined : Number(item.id),
    reference: getText(item.reference),
    ownerReference: getText(item.owner_reference),
    ownerFullName: getText(item.owner_full_name),
    invitedByReference:
      item.invited_by_reference === null ? null : getText(item.invited_by_reference),
    name: getText(item.name),
    slug: getText(item.slug),
    email: getText(item.email),
    phoneNumber: getText(item.phone_number),
    devise: getText(item.devise),
    address: address
      ? {
          country: countryPhoneCode,
          countryId:
            countryRecord?.id === undefined || countryRecord?.id === null
              ? undefined
              : String(countryRecord.id),
          countryPhoneCode,
          countryName: getText(countryRecord?.name),
          cityOrProvince: cityOrProvinceId,
          cityOrProvinceId,
          cityOrProvinceName: getText(cityOrProvinceRecord?.name),
          neighborhood: getText(address.neighborhood),
          street: getText(address.street),
          complementAdresse: getText(address.complement_adresse),
          postalCode: getText(address.postal_code),
          proximiteTransports: getText(address.proximite_transports),
          formattedAddress: getText(address.formatted_address),
          latitude:
            address.latitude === undefined || address.latitude === null
              ? null
              : Number(address.latitude),
          longitude:
            address.longitude === undefined || address.longitude === null
              ? null
              : Number(address.longitude),
        }
      : undefined,
    subscription: item.subscription,
    isArchivedAt: getText(item.is_archived_at) ?? null,
    createdAt: getText(item.created_at),
    updatedAt: getText(item.updated_at),
  };
}

function normalizeProduct(item: UnknownRecord): ProductSummary {
  const reference = item.reference ?? item.id ?? item.pk;

  return {
    reference: String(reference),
    pharmacyReference: String(item.pharmacy_reference || ""),
    name: String(item.name || "Produit sans nom"),
    description:
      getText(item.description) ??
      getText(item.product_description) ??
      getText(item.short_description) ??
      getText(item.details),
    form: getText(item.form),
    targetGender: getText(item.target_gender),
    targetAgeGroup: getText(item.target_age_group),
    therapeuticCategory: getText(item.therapeutic_category),
    strength: getText(item.strength),
    package: getText(item.package),
    salePrice: Number(item.sale_price || 0),
    purchasePrice:
      item.purchase_price === null || item.purchase_price === undefined
        ? undefined
        : Number(item.purchase_price || 0),
    currentStock: Number(item.current_stock || 0),
    createdDate: getText(item.created_date),
    expirationDate: getText(item.expiration_date),
    createdAt: getText(item.created_at),
    updatedAt: getText(item.updated_at),
  };
}

function normalizePharmacyJoinRequest(item: UnknownRecord): PharmacyJoinRequestSummary {
  return {
    id: item.id === undefined || item.id === null ? undefined : Number(item.id),
    pharmacy: item.pharmacy === undefined || item.pharmacy === null ? undefined : String(item.pharmacy),
    pharmacyName: getText(item.pharmacy_name),
    user: item.user === undefined || item.user === null ? undefined : String(item.user),
    userEmail: getText(item.user_email),
    requestedRole: getText(item.requested_role),
    message: getText(item.message),
    status: getText(item.status),
    isSeen: item.is_seen === undefined ? undefined : Boolean(item.is_seen),
    reviewerEmail: getText(item.reviewer_email),
    reviewedAt: getText(item.reviewed_at),
    createdAt: getText(item.created_at),
  };
}

function normalizePharmacyMember(item: UnknownRecord): PharmacyMember {
  const permissions = getRecord(item.permissions) || {};

  return {
    id: Number(item.id),
    pharmacy: String(item.pharmacy || ""),
    user: String(item.user || ""),
    userEmail: getText(item.user_email),
    userFullName: getText(item.user_full_name),
    role: String(item.role || "EMPLOYEE") as PharmacyMemberRole,
    isSuspended: Boolean(item.is_suspended),
    permissions: Object.fromEntries(
      Object.entries(permissions).map(([key, value]) => [key, Boolean(value)]),
    ) as PharmacyPermissions,
    joinedAt: getText(item.joined_at),
  };
}

function normalizeFilterOptions(data: unknown): ProductFilterOptions {
  const record = getRecord(data) || {};

  return {
    forms: normalizeOptions(record.forms),
    targetGenders: normalizeOptions(record.target_genders),
    targetAgeGroups: normalizeOptions(record.target_age_groups),
    therapeuticCategories: normalizeOptions(record.therapeutic_categories),
    stockStatuses: normalizeOptions(record.stock_statuses),
    orderings: normalizeOptions(record.orderings),
  };
}

function normalizePublicPharmacyFilterOptions(data: unknown): PublicPharmacyFilterOptions {
  const record = getRecord(data) || {};

  return {
    countries: normalizeOptions(record.countries),
    citiesOrProvinces: normalizeOptionsWithMeta(record.cities_or_provinces),
    neighborhoods: normalizeOptions(record.neighborhoods),
    orderings: normalizeOptions(record.orderings),
  };
}

function normalizeOptions(value: unknown): FilterOption[] {
  const rows = Array.isArray(value) ? value : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map((item) => ({
      value: String(item.value || ""),
      label: String(item.label || item.value || ""),
    }))
    .filter((option) => option.value && option.label);
}

function normalizeOptionsWithMeta(
  value: unknown,
): (FilterOption & { country?: string; countryName?: string })[] {
  const rows = Array.isArray(value) ? value : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map((item) => ({
      value: String(item.value || ""),
      label: String(item.label || item.value || ""),
      country: item.country === undefined || item.country === null ? undefined : String(item.country),
      countryName: getText(item.country_name),
    }))
    .filter((option) => option.value && option.label);
}

export async function getUserPharmacies(): Promise<PharmacySummary[]> {
  // API reelle du backend Kisinet: GET /api/pharmacies/
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  return dedupeRequest("auth:" + accessToken + ":GET:/api/pharmacies/", async () => {
    const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/", {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let message = "Impossible de charger vos pharmacies.";

      try {
        const data = await response.json();
        if (typeof data.detail === "string") {
          message = data.detail;
        }
      } catch {
        // Le backend peut parfois renvoyer une reponse non JSON.
      }

      throw new Error(message);
    }

    const responseText = await response.text();
    if (!responseText.trim()) {
      return [];
    }

    const data = JSON.parse(responseText);
    const rows = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

    return rows
      .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
      .map(normalizePharmacy)
      .filter((pharmacy: PharmacySummary) => Boolean(pharmacy.id));
  });
}

async function fetchApiJson<T>(path: string, fallbackMessage: string): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  return dedupeRequest("auth:" + accessToken + ":GET:" + path, async () => {
    const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const responseText = await response.text();
    const data = parseJsonResponse(responseText);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, fallbackMessage));
    }

    return data as T;
  });
}

async function fetchPublicApiJson<T>(path: string, fallbackMessage: string): Promise<T> {
  return dedupeRequest("public:GET:" + path, async () => {
    const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const responseText = await response.text();
    const data = parseJsonResponse(responseText);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, fallbackMessage));
    }

    return data as T;
  });
}

async function postApiJson<T>(path: string, fallbackMessage: string): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

async function postJson<T>(
  path: string,
  fallbackMessage: string,
  body?: unknown,
): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

async function sendApiJson<T>(
  path: string,
  method: "PATCH" | "PUT" | "DELETE",
  fallbackMessage: string,
  body?: unknown,
): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + path, {
    method,
    cache: "no-store",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

export async function getPublicPharmacies(
  filters: PublicPharmacyFilters = {},
): Promise<PaginatedPublicPharmacies> {
  const params = new URLSearchParams();
  appendFilter(params, "search", filters.search);
  appendFilter(params, "reference", filters.reference);
  appendFilter(params, "name", filters.name);
  appendFilter(params, "country", filters.country);
  appendFilter(params, "city_or_province", filters.cityOrProvince);
  appendFilter(params, "neighborhood", filters.neighborhood);
  appendFilter(params, "has_email", filters.hasEmail);
  appendFilter(params, "has_phone", filters.hasPhone);
  appendFilter(params, "ordering", filters.ordering);
  appendFilter(params, "page", filters.page);

  const path = "/api/pharmacies/public/" + (params.size ? "?" + params.toString() : "");
  const data = await fetchPublicApiJson<unknown>(
    path,
    "Impossible de charger les pharmacies publiques.",
  );
  const dataRecord = getRecord(data);
  const rows: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord?.results)
      ? dataRecord.results
      : [];
  const results = rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizePharmacy)
    .filter((pharmacy: PharmacySummary) => Boolean(pharmacy.id));

  return {
    count: Number(dataRecord?.count ?? results.length),
    next: getText(dataRecord?.next) || null,
    previous: getText(dataRecord?.previous) || null,
    results,
  };
}

export async function getPublicPharmacyByReference(
  reference: string,
): Promise<PharmacySummary | null> {
  const data = await getPublicPharmacies({
    reference,
    page: "1",
  });
  const normalizedReference = reference.trim().toUpperCase();

  return (
    data.results.find(
      (pharmacy) => pharmacy.reference?.toUpperCase() === normalizedReference,
    ) ||
    data.results.find((pharmacy) => pharmacy.id.toUpperCase() === normalizedReference) ||
    null
  );
}

export async function getPublicPharmacyFilterOptions(): Promise<PublicPharmacyFilterOptions> {
  const data = await fetchPublicApiJson<unknown>(
    "/api/pharmacies/public/filter-options/",
    "Impossible de charger les filtres pharmacies.",
  );

  return normalizePublicPharmacyFilterOptions(data);
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const data = await fetchApiJson<unknown>(
    "/api/accounts/me/",
    "Impossible de charger votre profil.",
  );

  return normalizeAccountProfile((data || {}) as UnknownRecord);
}

export async function getPharmacyActivity(pharmacyId: string): Promise<PharmacyActivity[]> {
  const data = await fetchApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/activity/",
    "Impossible de charger l'historique de la pharmacie.",
  );
  const rows = Array.isArray(data) ? data : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizePharmacyActivity);
}

export async function getCountries(): Promise<CountryOption[]> {
  const data = await fetchApiJson<unknown[] | { results?: unknown[] }>(
    "/api/pharmacies/countries/",
    "Impossible de charger les pays.",
  );
  const rows: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { results?: unknown[] }).results)
      ? (data as { results?: unknown[] }).results!
      : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name || ""),
      iso2: String(item.iso2 || ""),
      phoneCode: String(item.phone_code || ""),
    }))
    .filter((country) => country.id && country.name && country.phoneCode)
    .filter((country, index, list) => list.findIndex((item) => item.phoneCode === country.phoneCode) === index);
}

export type PharmacyPlanFeature = {
  label: string;
  enabled: boolean;
};

export type PharmacyPlanDuration = {
  durationMonths: number;
  label: string;
  discountPercentage: number;
  totalAmount: string;
};

export type PharmacyPlanAnalysisCredits = {
  enabled: boolean;
  label: string;
  monthlyAnalysisCredits: number;
  perUserMonthlyAnalysisCredits: number;
  multiplyByDurationMonths: boolean;
  unusedCreditsExpire: boolean;
  periodScope: string;
};

export type PharmacyPlan = {
  id: number;
  code: string;
  name: string;
  description: string;
  priceMonthly?: string;
  currency?: string;
  maxUsers: number | null;
  maxBranches: number | null;
  unlimitedUsers: boolean;
  unlimitedProducts: boolean;
  unlimitedBranches: boolean;
  features: PharmacyPlanFeature[];
  durations: PharmacyPlanDuration[];
  analysisCredits?: PharmacyPlanAnalysisCredits;
  highlighted?: boolean;
  // --- Champs facturation par siege (seat-based) ---
  // Renvoyes par la nouvelle API `/api/paiements/plans/`. Ils restent optionnels
  // pour ne pas casser l'ancienne API `/api/paiements/pharmacy-plans/` qui ne
  // les expose pas.
  version?: number;
  pricePerUserMonth?: string;
  includedAiCreditPerUserMonth?: number;
  minBillableUsers?: number;
  currencyId?: number;
  isActive?: boolean;
  featuresMap?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
};

export type PharmacySubscriptionPayment = {
  id: number;
  pharmacyReference?: string;
  planCode: string;
  durationMonths: number;
  amount: string;
  currency: string;
  status: string;
  paidAt?: string | null;
  reference: string;
  orderId: string;
  providerReference?: string;
  createdAt?: string;
};

export type AgregateurSubscriptionCheckout = {
  checkoutUrl: string;
  payment: PharmacySubscriptionPayment;
  subscription?: unknown;
};

/**
 * Champs seat-based ajoutes sur l'abonnement par le backend.
 * Tous optionnels : l'ancienne reponse d'abonnement reste valide.
 */
export type PharmacySubscriptionSeatBilling = {
  pricingPlan?: number | null;
  planSnapshot?: Record<string, unknown>;
  currentUserCount?: number;
  unitPriceSnapshot?: string;
  monthlyAmount?: string;
  billingCycleAnchor?: string | null;
};

function normalizeSubscriptionPayment(item: UnknownRecord): PharmacySubscriptionPayment {
  return {
    id: Number(item.id),
    pharmacyReference: getText(item.pharmacy_reference),
    planCode: String(item.plan_code || ""),
    durationMonths: Number(item.duration_months || 0),
    amount: String(item.amount ?? ""),
    currency: String(item.currency || ""),
    status: String(item.status || ""),
    paidAt: getText(item.paid_at),
    reference: String(item.reference || ""),
    orderId: String(item.order_id || ""),
    providerReference: getText(item.provider_reference),
    createdAt: getText(item.created_at),
  };
}

function normalizePharmacyPlan(item: UnknownRecord): PharmacyPlan {
  // La nouvelle API seat-based renvoie `features` sous forme d'objet
  // ({"can_export_pdf": true}) alors que l'ancienne renvoie un tableau
  // ({label, enabled}). On alimente les deux representations.
  const featuresMap = normalizePlanFeaturesMap(item.features);

  return {
    id: Number(item.id),
    code: String(item.code || ""),
    name: String(item.name || item.label || ""),
    description: String(item.description || item.tagline || ""),
    priceMonthly: getText(
      item.price_monthly ?? item.price ?? item.monthly_price ?? item.price_per_user_month,
    ),
    currency: typeof item.currency === "string" ? item.currency : "",
    maxUsers: item.max_users === null || item.max_users === undefined ? null : Number(item.max_users),
    maxBranches: item.max_branches === null || item.max_branches === undefined ? null : Number(item.max_branches),
    unlimitedUsers:
      item.unlimited_users === undefined ? item.max_users === null : Boolean(item.unlimited_users),
    unlimitedProducts: Boolean(item.unlimited_products),
    unlimitedBranches: Boolean(item.unlimited_branches),
    features: Array.isArray(item.features)
      ? item.features.map((feature: unknown) => {
          const featureRecord = feature as UnknownRecord;
          return {
            label: String(featureRecord.label || featureRecord.key || ""),
            enabled: Boolean(featureRecord.enabled),
          };
        })
      : featuresMap
        ? Object.entries(featuresMap).map(([label, enabled]) => ({ label, enabled }))
        : [],
    durations: Array.isArray(item.durations)
      ? item.durations.map((duration: unknown) => {
          const durationRecord = duration as UnknownRecord;
          return {
            durationMonths: Number(durationRecord.duration_months),
            label: String(durationRecord.label || ""),
            discountPercentage: Number(durationRecord.discount_percentage),
            totalAmount: String(durationRecord.total_amount ?? ""),
          };
        })
      : [],
    analysisCredits:
      item.analysis_credits && typeof item.analysis_credits === "object"
        ? normalizePharmacyPlanAnalysisCredits(item.analysis_credits as UnknownRecord)
        : undefined,
    highlighted: Boolean(item.highlighted ?? item.is_popular ?? item.popular),
    version: item.version === undefined ? undefined : Number(item.version),
    pricePerUserMonth: getText(item.price_per_user_month),
    includedAiCreditPerUserMonth:
      item.included_ai_credit_per_user_month === undefined
        ? undefined
        : Number(item.included_ai_credit_per_user_month),
    minBillableUsers: item.min_billable_users === undefined ? undefined : Number(item.min_billable_users),
    currencyId: typeof item.currency === "number" ? item.currency : undefined,
    isActive: item.is_active === undefined ? undefined : Boolean(item.is_active),
    featuresMap,
    createdAt: getText(item.created_at),
    updatedAt: getText(item.updated_at),
  };
}

function normalizePlanFeaturesMap(value: unknown): Record<string, boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value as UnknownRecord).map(([key, entry]) => [key, Boolean(entry)]),
  );
}

function normalizePharmacyPlanAnalysisCredits(item: UnknownRecord): PharmacyPlanAnalysisCredits {
  return {
    enabled: Boolean(item.enabled),
    label: String(item.label || "Crédits d'analyse"),
    monthlyAnalysisCredits: Number(item.monthly_analysis_credits || 0),
    perUserMonthlyAnalysisCredits: Number(item.per_user_monthly_analysis_credits || 0),
    multiplyByDurationMonths: Boolean(item.multiply_by_duration_months),
    unusedCreditsExpire: Boolean(item.unused_credits_expire),
    periodScope: String(item.period_scope || ""),
  };
}

export async function getPharmacyPlans(): Promise<PharmacyPlan[]> {
  const data = await fetchPublicApiJson<unknown>(
    "/api/paiements/pharmacy-plans/",
    "Impossible de charger les plans pharmacie.",
  );
  const record = data as UnknownRecord | null;
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(record?.results)
      ? record.results
      : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map((item: UnknownRecord) => normalizePharmacyPlan(item))
    .filter((plan: PharmacyPlan) => Boolean(plan.id) || Boolean(plan.name));
}

export async function getPharmacyPlan(name: string): Promise<PharmacyPlan> {
  const data = await fetchPublicApiJson<UnknownRecord>(
    "/api/paiements/pharmacy-plans/" + encodeURIComponent(name) + "/",
    "Impossible de charger le plan pharmacie.",
  );

  return normalizePharmacyPlan(data);
}

/**
 * Plans de la facturation par siege (`GET /api/paiements/plans/`).
 *
 * Endpoint distinct de `getPharmacyPlans()` qui, lui, consomme toujours
 * l'ancien catalogue `/api/paiements/pharmacy-plans/`. Les deux sources
 * coexistent cote backend et n'exposent pas les memes champs.
 */
export async function getSeatBasedPlans(
  filters: { code?: string; search?: string; ordering?: string } = {},
): Promise<PharmacyPlan[]> {
  const params = new URLSearchParams();
  appendFilter(params, "code", filters.code);
  appendFilter(params, "search", filters.search);
  appendFilter(params, "ordering", filters.ordering);

  const path = "/api/paiements/plans/" + (params.size ? "?" + params.toString() : "");
  const data = await fetchPublicApiJson<unknown>(path, "Impossible de charger les plans.");

  return toRecordList(data)
    .map((item) => normalizePharmacyPlan(item))
    .filter((plan) => Boolean(plan.id) || Boolean(plan.code));
}

/** Detail d'un plan seat-based par code (`GET /api/paiements/plans/{code}/`). */
export async function getSeatBasedPlan(code: string): Promise<PharmacyPlan> {
  const data = await fetchPublicApiJson<UnknownRecord>(
    "/api/paiements/plans/" + encodeURIComponent(code) + "/",
    "Impossible de charger le plan.",
  );

  return normalizePharmacyPlan(data);
}

/**
 * Initialise le paiement d'un abonnement (facturation par siege).
 *
 * Le frontend ne transmet que les informations de la commande : identifiant du
 * plan, nombre d'utilisateurs, duree et devise. Le backend reste la seule
 * source de verite pour le montant, les remises et les credits IA inclus :
 * aucun montant n'est envoye ni recalcule ici.
 */
export async function initiateAgregateurSubscriptionCheckout(payload: {
  pharmacyReference: string;
  planCode: string;
  durationMonths: number;
  currency: string;
  /** Identifiant numerique du plan seat-based, quand il est connu. */
  planId?: number;
  /** Nombre d'utilisateurs actifs factures (modele seat-based). */
  userCount?: number;
}): Promise<AgregateurSubscriptionCheckout> {
  const pharmacyReference = payload.pharmacyReference.trim();
  if (!pharmacyReference) {
    throw new Error("La référence de la pharmacie est requise pour lancer le paiement.");
  }

  if (!payload.planCode && !Number.isFinite(payload.planId)) {
    throw new Error("Le plan sélectionné est introuvable.");
  }

  if (!Number.isInteger(payload.durationMonths) || payload.durationMonths < 1) {
    throw new Error("La durée d'abonnement sélectionnée est invalide.");
  }

  if (
    payload.userCount !== undefined &&
    (!Number.isInteger(payload.userCount) || payload.userCount < 1)
  ) {
    throw new Error("Le nombre d'utilisateurs doit être un entier supérieur ou égal à 1.");
  }

  const body: UnknownRecord = {
    pharmacy_reference: pharmacyReference,
    plan_code: payload.planCode,
    duration_months: payload.durationMonths,
    currency: payload.currency,
  };

  // Champs seat-based : envoyes uniquement quand ils sont connus, afin de
  // rester compatible avec l'ancien contrat de l'endpoint.
  if (Number.isFinite(payload.planId) && Number(payload.planId) > 0) {
    body.plan_id = Number(payload.planId);
  }

  if (payload.userCount !== undefined) {
    body.user_count = payload.userCount;
  }

  const data = await postJson<UnknownRecord>(
    "/api/paiements/pharmacy-subscriptions/agregateur/checkout/",
    "Impossible d'initialiser le paiement.",
    body,
  );

  const payment = normalizeSubscriptionPayment((data.payment || {}) as UnknownRecord);
  const checkoutUrl = String(data.checkout_url || "");

  // Le backend a repondu 2xx mais sans URL de paiement : on evite d'ouvrir un
  // ecran de paiement vide et on remonte une erreur explicite.
  if (!checkoutUrl) {
    throw new Error(
      "Le serveur n'a pas renvoyé d'URL de paiement. Réessayez dans quelques instants.",
    );
  }

  return {
    checkoutUrl,
    payment,
    subscription: data.subscription,
  };
}

export async function getPharmacySubscriptionPayment(
  paymentId: number,
  pharmacyReference: string,
): Promise<PharmacySubscriptionPayment> {
  const params = new URLSearchParams({ pharmacy_reference: pharmacyReference });
  const data = await fetchApiJson<UnknownRecord>(
    "/api/paiements/subscription-payments/" +
      encodeURIComponent(String(paymentId)) +
      "/?" +
      params.toString(),
    "Impossible de vérifier le statut du paiement.",
  );
  return normalizeSubscriptionPayment(data);
}

export async function getCitiesOrProvinces(country: string): Promise<CityOrProvinceOption[]> {
  const params = new URLSearchParams();
  if (country) {
    params.set("country", country);
  }

  const path = "/api/pharmacies/cities-or-provinces/" + (params.size ? "?" + params.toString() : "");
  const data = await fetchApiJson<unknown>(path, "Impossible de charger les villes ou provinces.");
  const rows = Array.isArray(data) ? data : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: Number(item.id),
      country: Number(item.country),
      countryPhoneCode: String(item.country_phone_code || ""),
      name: String(item.name || ""),
      code: getText(item.code),
    }))
    .filter((city) => city.id && city.name);
}

export async function getPharmacyProducts(
  pharmacyId: string,
  filters: ProductFilters = {},
): Promise<PaginatedProducts> {
  const params = new URLSearchParams({ pharmacy_reference: pharmacyId });
  appendFilter(params, "search", filters.search);
  appendFilter(params, "reference", filters.reference);
  appendFilter(params, "name", filters.name);
  appendFilter(params, "form", filters.form);
  appendFilter(params, "target_gender", filters.targetGender);
  appendFilter(params, "target_age_group", filters.targetAgeGroup);
  appendFilter(params, "therapeutic_category", filters.therapeuticCategory);
  appendFilter(params, "strength", filters.strength);
  appendFilter(params, "package", filters.package);
  appendFilter(params, "stock_status", filters.stockStatus);
  appendFilter(params, "min_stock", filters.minStock);
  appendFilter(params, "max_stock", filters.maxStock);
  appendFilter(params, "min_sale_price", filters.minSalePrice);
  appendFilter(params, "max_sale_price", filters.maxSalePrice);
  appendFilter(params, "min_purchase_price", filters.minPurchasePrice);
  appendFilter(params, "max_purchase_price", filters.maxPurchasePrice);
  appendFilter(params, "created_from", filters.createdFrom);
  appendFilter(params, "created_to", filters.createdTo);
  appendFilter(params, "updated_from", filters.updatedFrom);
  appendFilter(params, "updated_to", filters.updatedTo);
  appendFilter(params, "ordering", filters.ordering);
  appendFilter(params, "page", filters.page);

  const data = await fetchApiJson<unknown>(
    "/api/products/?" + params.toString(),
    "Impossible de charger les produits.",
  );
  const dataRecord = getRecord(data);
  const rows: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord?.results)
      ? dataRecord.results
      : [];
  const results = rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizeProduct)
    .filter((product: ProductSummary) => Boolean(product.reference));

  return {
    count: Number(dataRecord?.count ?? results.length),
    next: getText(dataRecord?.next) || null,
    previous: getText(dataRecord?.previous) || null,
    results,
  };
}

export async function getProductFilterOptions(pharmacyId: string): Promise<ProductFilterOptions> {
  const params = new URLSearchParams({ pharmacy_reference: pharmacyId });
  const data = await fetchApiJson<unknown>(
    "/api/products/filter-options/?" + params.toString(),
    "Impossible de charger les filtres produits.",
  );

  return normalizeFilterOptions(data);
}

function appendFilter(params: URLSearchParams, name: string, value?: string) {
  if (value && value.trim()) {
    params.set(name, value.trim());
  }
}

export async function getPharmacyPermissions(pharmacyId: string): Promise<PharmacyPermissions> {
  const data = await fetchApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/permissions/",
    "Impossible de charger vos permissions.",
  );
  const record = getRecord(data) || {};

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, Boolean(value)]),
  ) as PharmacyPermissions;
}

export async function getPharmacyDetail(pharmacyId: string): Promise<PharmacyDetail> {
  const data = await fetchApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/",
    "Impossible de charger les informations de la pharmacie.",
  );

  return normalizePharmacyDetail((data || {}) as UnknownRecord);
}

export async function updatePharmacy(
  pharmacyId: string,
  input: UpdatePharmacyInput,
): Promise<PharmacyDetail> {
  const payload: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    phone_number: input.phoneNumber,
  };

  // L'adresse est imbriquee : on l'envoie uniquement si fournie.
  if (input.address) {
    payload.adresse = {
      country: input.address.country,
      city_or_province: input.address.cityOrProvince ?? null,
      neighborhood: input.address.neighborhood,
      street: input.address.street,
      complement_adresse: input.address.complementAdresse,
      postal_code: input.address.postalCode,
      proximite_transports: input.address.proximiteTransports,
      formatted_address: input.address.formattedAddress,
    };
  }

  const data = await sendApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/",
    "PUT",
    "Impossible de modifier la pharmacie.",
    payload,
  );

  return normalizePharmacyDetail((data || {}) as UnknownRecord);
}

export async function getPharmacyMembers(pharmacyId: string): Promise<PharmacyMember[]> {
  const data = await fetchApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/members/",
    "Impossible de charger les membres.",
  );
  const rows = Array.isArray(data) ? data : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizePharmacyMember)
    .filter((member) => Boolean(member.id));
}

export async function updatePharmacyMember(
  pharmacyId: string,
  memberId: number,
  input: UpdatePharmacyMemberInput,
): Promise<PharmacyMember> {
  const payload = {
    role: input.role,
    is_suspended: input.isSuspended,
  };
  const data = await postJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/members/" + memberId + "/",
    "Impossible de modifier ce membre.",
    payload,
  );

  return normalizePharmacyMember((data || {}) as UnknownRecord);
}

export async function suspendPharmacyMember(
  pharmacyId: string,
  memberId: number,
): Promise<PharmacyMember> {
  const data = await postJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/members/" + memberId + "/",
    "Impossible de suspendre ce membre.",
    { is_suspended: true },
  );

  return normalizePharmacyMember((data || {}) as UnknownRecord);
}

export async function deletePharmacyMember(pharmacyId: string, memberId: number) {
  await sendApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/members/" + memberId + "/",
    "DELETE",
    "Impossible de supprimer ce membre.",
  );
}

export async function assignPharmacyMemberPermissions(
  pharmacyId: string,
  memberId: number,
  permissions: PharmacyPermissions,
): Promise<PharmacyMember> {
  const data = await sendApiJson<unknown>(
    "/api/pharmacies/" + pharmacyId + "/members/" + memberId + "/permissions/",
    "PUT",
    "Le backend n'a pas renvoyé la raison de cette erreur.",
    permissions,
  );

  return normalizePharmacyMember((data || {}) as UnknownRecord);
}

export async function getPharmacyJoinRequests(
  pharmacyDatabaseId: string,
): Promise<PharmacyJoinRequestSummary[]> {
  const data = await fetchApiJson<unknown>(
    "/api/pharmacies/" + pharmacyDatabaseId + "/join-requests/",
    "Impossible de charger les notifications.",
  );
  const rows = Array.isArray(data) ? data : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizePharmacyJoinRequest)
    .filter((joinRequest) => Boolean(joinRequest.id));
}

export async function acceptPharmacyJoinRequest(
  pharmacyDatabaseId: string,
  joinRequestId: number,
): Promise<PharmacyJoinRequestSummary> {
  const data = await postApiJson<unknown>(
    "/api/pharmacies/" + pharmacyDatabaseId + "/join-requests/" + joinRequestId + "/accept/",
    "Impossible d'accepter cette demande.",
  );

  return data && typeof data === "object"
    ? normalizePharmacyJoinRequest(data as UnknownRecord)
    : {};
}

export async function rejectPharmacyJoinRequest(
  pharmacyDatabaseId: string,
  joinRequestId: number,
): Promise<PharmacyJoinRequestSummary> {
  const data = await postApiJson<unknown>(
    "/api/pharmacies/" + pharmacyDatabaseId + "/join-requests/" + joinRequestId + "/reject/",
    "Impossible de refuser cette demande.",
  );

  return data && typeof data === "object"
    ? normalizePharmacyJoinRequest(data as UnknownRecord)
    : {};
}

export async function archivePharmacyJoinRequest(
  pharmacyDatabaseId: string,
  joinRequestId: number,
): Promise<PharmacyJoinRequestSummary> {
  const data = await postApiJson<unknown>(
    "/api/pharmacies/" + pharmacyDatabaseId + "/join-requests/" + joinRequestId + "/archive/",
    "Impossible d'archiver cette demande.",
  );

  return data && typeof data === "object"
    ? normalizePharmacyJoinRequest(data as UnknownRecord)
    : {};
}

function getApiErrorMessages(data: unknown, fallback: string, path = ""): string[] {
  const record = getRecord(data);
  if (!record) {
    if (Array.isArray(data)) {
      return data.flatMap((item) => getApiErrorMessages(item, fallback, path));
    }

    if (typeof data === "string") {
      return [path ? path + " : " + data : data];
    }

    return [fallback];
  }

  if (typeof record.detail === "string") {
    return [record.detail];
  }

  const messages = Object.entries(record)
    .flatMap(([field, value]) => {
      const fieldPath = path ? path + "." + field : field;

      if (Array.isArray(value)) {
        return value.flatMap((item) => getApiErrorMessages(item, fallback, fieldPath));
      }

      if (typeof value === "string") {
        return [fieldPath + " : " + value];
      }

      if (value && typeof value === "object") {
        return getApiErrorMessages(value, fallback, fieldPath);
      }

      return [];
    })
    .filter(Boolean);

  return messages.length ? messages : [fallback];
}

export function getApiErrorMessage(data: unknown, fallback: string) {
  return getApiErrorMessages(data, fallback).join("\n");
}

export function parseJsonResponse(responseText: string) {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

export async function createPharmacy(input: CreatePharmacyInput): Promise<PharmacySummary> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  const adresse = {
    country: input.country,
    city_or_province: input.cityOrProvince || undefined,
    street: input.street,
    neighborhood: input.neighborhood,
  };

  const invitedBy = (input.invitedBy || "").trim().toUpperCase();

  const payload = {
    name: input.name,
    email: input.email || undefined,
    phone_number: input.phoneNumber || undefined,
    devise: input.devise || "USD",
    // Le backend résout lui-même la référence publique du parrain vers le
    // compte correspondant : on omet la clé quand aucun code n'est saisi.
    invited_by: invitedBy || undefined,
    adresse,
  };

  const response = await authenticatedFetch(apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/", {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de créer cette pharmacie."));
  }

  if (!data || typeof data !== "object") {
    throw new Error("La pharmacie a été créée, mais la réponse du serveur est invalide.");
  }

  return normalizePharmacy(data as UnknownRecord);
}

export async function createPharmacyJoinRequest(
  input: CreatePharmacyJoinRequestInput,
): Promise<PharmacyJoinRequestSummary> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiAuthError();
  }

  const payload = {
    pharmacy: input.pharmacy,
    requested_role: input.requestedRole || "EMPLOYEE",
    message: input.message || "",
  };

  const response = await authenticatedFetch(
    apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/join-requests/",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(data, "Impossible d'envoyer cette demande d'adhésion."),
    );
  }

  if (!data || typeof data !== "object") {
    return {};
  }

  return normalizePharmacyJoinRequest(data as UnknownRecord);
}
