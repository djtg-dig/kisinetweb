import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type PharmacySummary = {
  id: string;
  name: string;
  role?: string;
  status?: string;
};

type UnknownRecord = Record<string, unknown>;

function normalizePharmacy(item: UnknownRecord): PharmacySummary {
  const id = item.reference ?? item.id ?? item.pk;
  const name = item.name ?? item.title ?? "Pharmacie sans nom";

  return {
    id: String(id),
    name: String(name),
    role: typeof item.role === "string" ? item.role : undefined,
    status: typeof item.status === "string" ? item.status : undefined,
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

  const data = await response.json();
  const rows = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

  return rows
    .filter((item: unknown): item is UnknownRecord => Boolean(item) && typeof item === "object")
    .map(normalizePharmacy)
    .filter((pharmacy: PharmacySummary) => Boolean(pharmacy.id));
}
