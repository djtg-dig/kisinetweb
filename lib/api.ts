import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type PharmacySummary = {
  id: string;
  reference?: string;
  name: string;
  role?: string;
  status?: string;
  email?: string;
  phoneNumber?: string;
  addressLine?: string;
  planName?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
};

export type CreatePharmacyInput = {
  name: string;
  email?: string;
  phoneNumber?: string;
  country: string;
  street?: string;
  neighborhood?: string;
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
  const name = item.name ?? item.title ?? "Pharmacie sans nom";
  const address = getRecord(item.adresse);
  const subscription = getRecord(item.subscription);
  const addressParts = [
    getText(address?.street),
    getText(address?.neighborhood),
    getText(address?.formatted_address),
  ].filter(Boolean);

  return {
    id: String(id),
    reference: getText(item.reference) ?? String(id),
    name: String(name),
    role: getText(item.role),
    status: getText(item.status) ?? getText(subscription?.status),
    email: getText(item.email),
    phoneNumber: getText(item.phone_number),
    addressLine: addressParts.join(", ") || undefined,
    planName: getText(subscription?.plan_name) ?? getText(subscription?.plan_code),
    subscriptionStatus: getText(subscription?.status),
    trialEndsAt: getText(subscription?.trial_ends_at),
  };
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

function getApiErrorMessage(data: unknown, fallback: string) {
  return getApiErrorMessages(data, fallback).join("\n");
}

function parseJsonResponse(responseText: string) {
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
    street: input.street,
    neighborhood: input.neighborhood,
  };

  const payload = {
    name: input.name,
    email: input.email || undefined,
    phone_number: input.phoneNumber || undefined,
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
