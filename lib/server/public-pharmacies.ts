import "server-only";

import { cache } from "react";
import { signedBackendFetch } from "@/lib/server/backend-fetch";
import type { PharmacySummary } from "@/lib/api";

type UnknownRecord = Record<string, unknown>;

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

export const getPublicPharmacyByReferenceServer = cache(async function getPublicPharmacyByReferenceServer(
  reference: string,
): Promise<PharmacySummary | null> {
  const path =
    "/api/pharmacies/public/?reference=" +
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
  const dataRecord = getRecord(data);
  const rows: UnknownRecord[] = Array.isArray(data)
    ? (data as UnknownRecord[])
    : Array.isArray(dataRecord?.results)
      ? (dataRecord.results as UnknownRecord[])
      : [];
  const normalizedReference = reference.trim().toUpperCase();
  const results = rows
    .map(normalizePharmacy)
    .filter(
      (pharmacy: PharmacySummary) =>
        Boolean(pharmacy.id) && pharmacy.isPublic === true,
    );

  return (
    results.find(
      (pharmacy) => pharmacy.reference?.toUpperCase() === normalizedReference,
    ) ||
    results.find((pharmacy) => pharmacy.id.toUpperCase() === normalizedReference) ||
    null
  );
});
