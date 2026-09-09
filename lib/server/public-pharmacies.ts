import "server-only";

import { cache } from "react";
import { signedBackendFetch } from "@/lib/server/backend-fetch";
import type { PharmacySummary } from "@/lib/api";

type UnknownRecord = Record<string, unknown>;
type PublicPharmaciesPage = {
  next: string | null;
  results: PharmacySummary[];
};

const PUBLIC_PHARMACIES_PATH = "/api/pharmacies/public";
const PUBLIC_PHARMACIES_SITEMAP_REVALIDATE_SECONDS = 60 * 60;

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function getText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizePharmacy(item: UnknownRecord): PharmacySummary {
  const address = getRecord(item.adresse) || getRecord(item.address);
  const country = getRecord(address?.country) || getRecord(address?.pays);
  const city = getRecord(address?.city_or_province) || getRecord(address?.city);
  const plan = getRecord(item.plan) || getRecord(item.subscription);

  return {
    id: String(item.id ?? item.databaseId ?? ""),
    databaseId: item.databaseId ? String(item.databaseId) : undefined,
    reference: getText(item.reference),
    name: getText(item.name) || "Pharmacie",
    description: getText(item.description),
    isPublic: item.is_public === undefined ? undefined : Boolean(item.is_public),
    devise: getText(item.devise) || getText(item.currency),
    role: getText(item.role),
    status: getText(item.status),
    email: getText(item.email),
    phoneNumber: getText(item.phone_number) || getText(item.phoneNumber),
    addressLine: getText(address?.street) || getText(address?.address_line),
    country: getText(country?.name),
    countryId: country?.id ? String(country.id) : undefined,
    cityOrProvince: getText(city?.name),
    cityOrProvinceId: city?.id ? String(city.id) : undefined,
    neighborhood: getText(address?.neighborhood) || getText(address?.quartier),
    street: getText(address?.street),
    latitude: getText(address?.latitude) || getText(item.latitude),
    longitude: getText(address?.longitude) || getText(item.longitude),
    planName: getText(plan?.name) || getText(item.planName),
    subscriptionStatus: getText(plan?.status) || getText(item.subscriptionStatus),
    trialEndsAt: getText(plan?.trial_ends_at) || getText(item.trialEndsAt),
  };
}

function getPageItems(data: unknown): UnknownRecord[] {
  const dataRecord = getRecord(data);
  const rows: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord?.results)
      ? dataRecord.results
      : [];

  return rows.filter(
    (item: unknown): item is UnknownRecord =>
      Boolean(item) && typeof item === "object",
  );
}

function normalizePublicPharmaciesPage(data: unknown): PublicPharmaciesPage {
  const dataRecord = getRecord(data);

  return {
    next: getText(dataRecord?.next) || null,
    results: getPageItems(data)
      .map(normalizePharmacy)
      .filter(
        (pharmacy: PharmacySummary) =>
          Boolean(pharmacy.id) && pharmacy.isPublic === true,
      ),
  };
}

export const getPublicPharmacyByReferenceServer = cache(async function getPublicPharmacyByReferenceServer(
  reference: string,
): Promise<PharmacySummary | null> {
  const path =
    PUBLIC_PHARMACIES_PATH + "?reference=" +
    encodeURIComponent(reference) +
    "&page=1";
  const response = await signedBackendFetch({
    path,
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Impossible de charger la pharmacie publique.");
  }

  const data = (await response.json()) as unknown;
  const normalizedReference = reference.trim().toUpperCase();
  const { results } = normalizePublicPharmaciesPage(data);

  return (
    results.find(
      (pharmacy) => pharmacy.reference?.toUpperCase() === normalizedReference,
    ) ||
    results.find((pharmacy) => pharmacy.id.toUpperCase() === normalizedReference) ||
    null
  );
});

export async function getAllPublicPharmaciesForSitemapServer(): Promise<PharmacySummary[]> {
  const pharmacies: PharmacySummary[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await signedBackendFetch({
      path: PUBLIC_PHARMACIES_PATH + "?page=" + page,
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "force-cache",
      revalidate: PUBLIC_PHARMACIES_SITEMAP_REVALIDATE_SECONDS,
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les pharmacies publiques du sitemap.");
    }

    const data = (await response.json()) as unknown;
    const pageData = normalizePublicPharmaciesPage(data);

    pharmacies.push(
      ...pageData.results.filter((pharmacy) => Boolean(pharmacy.reference?.trim())),
    );

    hasNextPage = Boolean(pageData.next);
    page += 1;
  }

  return pharmacies;
}
