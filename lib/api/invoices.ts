import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";

export type PendingInvoice = {
  id: string;
  reference: string;
  customer: string;
  amount: number;
  createdAt: string;
};

// Type proche de la réponse brute du backend : les champs restent optionnels car
// l'API peut évoluer ou renvoyer une valeur vide selon le contexte.
type PendingInvoiceApiItem = {
  id?: string | number;
  reference?: string;
  customer?: string;
  amount?: string | number;
  created_at?: string;
};

export async function getPendingPharmacyInvoices(pharmacyId: string): Promise<PendingInvoice[]> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const response = await fetch(
    apiBaseUrl.replace(/\/$/, "") + "/api/pharmacies/" + pharmacyId + "/invoices/pending/",
    {
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + accessToken,
        Accept: "application/json",
      },
    },
  );

  // On lit d'abord en texte pour pouvoir gérer proprement une réponse vide ou non JSON.
  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de charger les factures."));
  }

  if (!Array.isArray(data)) {
    return [];
  }

  // La page consomme un modèle stable même si l'API renvoie des nombres sous forme de chaînes.
  return data.map((item) => normalizePendingInvoice((item || {}) as PendingInvoiceApiItem));
}

function normalizePendingInvoice(item: PendingInvoiceApiItem): PendingInvoice {
  // Cette fonction convertit la réponse backend vers le type utilisé par les composants React.
  return {
    id: String(item.id || item.reference || ""),
    reference: item.reference || "Facture sans référence",
    customer: item.customer || "Client non renseigné",
    amount: Number(item.amount || 0),
    createdAt: item.created_at || "",
  };
}

function parseJsonResponse(responseText: string) {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function getApiErrorMessage(data: unknown, fallbackMessage: string): string {
  // `unknown` oblige TypeScript à vérifier le type avant d'accéder aux propriétés.
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return fallbackMessage;
  }

  const detail = (data as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail : fallbackMessage;
}
