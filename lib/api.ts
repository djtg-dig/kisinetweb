import { getAccessToken } from "@/lib/auth";
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

export type PharmacyAddress = {
  country?: string | number;
  cityOrProvince?: string | number;
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

export type UpdatePharmacyInput = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  devise?: string;
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
  salePrice: number;
  purchasePrice?: number;
  currentStock: number;
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

function getText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
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

function normalizePharmacyDetail(item: UnknownRecord): PharmacyDetail {
  const address = getRecord(item.adresse);
  const country = address?.country;
  const cityOrProvince = address?.city_or_province;

  return {
    id:
      item.id === undefined || item.id === null ? undefined : Number(item.id),
    reference: getText(item.reference),
    ownerReference: getText(item.owner_reference),
    invitedByReference:
      item.invited_by_reference === null ? null : getText(item.invited_by_reference),
    name: getText(item.name),
    slug: getText(item.slug),
    email: getText(item.email),
    phoneNumber: getText(item.phone_number),
    devise: getText(item.devise),
    address: address
      ? {
          country:
            country === undefined || country === null ? undefined : String(country),
          cityOrProvince:
            cityOrProvince === undefined || cityOrProvince === null
              ? undefined
              : String(cityOrProvince),
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
    salePrice: Number(item.sale_price || 0),
    purchasePrice:
      item.purchase_price === null || item.purchase_price === undefined
        ? undefined
        : Number(item.purchase_price || 0),
    currentStock: Number(item.current_stock || 0),
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
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/", {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
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
}

async function fetchApiJson<T>(path: string, fallbackMessage: string): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
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

async function fetchPublicApiJson<T>(path: string, fallbackMessage: string): Promise<T> {
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
}

async function postApiJson<T>(path: string, fallbackMessage: string): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
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
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
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
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const headers: HeadersInit = {
    Authorization: "Bearer " + accessToken,
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
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

export async function getCountries(): Promise<CountryOption[]> {
  const data = await fetchApiJson<unknown>("/api/pharmacies/countries/", "Impossible de charger les pays.");
  const rows = Array.isArray(data) ? data : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name || ""),
      iso2: String(item.iso2 || ""),
      phoneCode: String(item.phone_code || ""),
    }))
    .filter((country) => country.id && country.name && country.phoneCode);
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
  const payload = {
    name: input.name,
    email: input.email,
    phone_number: input.phoneNumber,
    devise: input.devise,
  };
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
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const adresse = {
    country: input.country,
    city_or_province: input.cityOrProvince || undefined,
    street: input.street,
    neighborhood: input.neighborhood,
  };

  const payload = {
    name: input.name,
    email: input.email || undefined,
    phone_number: input.phoneNumber || undefined,
    devise: input.devise || "USD",
    adresse,
  };

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/", {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
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
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const payload = {
    pharmacy: input.pharmacy,
    requested_role: input.requestedRole || "EMPLOYEE",
    message: input.message || "",
  };

  const response = await fetch(
    apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/join-requests/",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + accessToken,
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
