import { apiFetch } from "@/lib/api/request";
import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";
import { getApiErrorMessage, parseJsonResponse, type ProductFilters } from "@/lib/api";

export type ProductFormOption = {
  value: string;
  label: string;
};

export type CreateProductPayload = {
  pharmacy_reference: string;
  name: string;
  description?: string;
  form: string;
  target_gender: string;
  target_age_group: string;
  therapeutic_category: string;
  strength?: string;
  package?: string;
  sale_price: number;
  purchase_price?: number | null;
  current_stock?: number;
  created_date?: string | null;
  expiration_date?: string | null;
};

export type Product = {
  reference: string;
  pharmacy_reference: string;
  name: string;
  description?: string;
  form?: string;
  target_gender?: string;
  target_age_group?: string;
  therapeutic_category?: string;
  strength?: string;
  package?: string;
  sale_price: number;
  purchase_price?: number | null;
  current_stock: number;
  created_date?: string | null;
  expiration_date?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Valeurs manipulées par le formulaire (champs texte/nombre en chaînes).
export type ProductFormValues = {
  name: string;
  description: string;
  form: string;
  target_gender: string;
  target_age_group: string;
  therapeutic_category: string;
  strength: string;
  package: string;
  sale_price: string;
  purchase_price: string;
  current_stock: string;
  created_date: string;
  expiration_date: string;
};

export const PRODUCT_FORM_DEFAULT = "TABLET";
export const TARGET_GENDER_DEFAULT = "UNDEFINED";
export const TARGET_AGE_GROUP_DEFAULT = "ALL";
export const THERAPEUTIC_CATEGORY_DEFAULT = "OTHER";

export const PRODUCT_FORMS: ProductFormOption[] = [
  { value: "TABLET", label: "Comprimé" },
  { value: "CAPSULE", label: "Gélule" },
  { value: "SYRUP", label: "Sirop" },
  { value: "AMPOULE", label: "Ampoule" },
  { value: "VIAL", label: "Flacon" },
  { value: "POWDER", label: "Poudre" },
  { value: "OINTMENT", label: "Pommade" },
  { value: "CREAM", label: "Crème" },
  { value: "DROPS", label: "Gouttes" },
  { value: "INJECTION", label: "Injectable" },
  { value: "SACHET", label: "Sachet" },
  { value: "DEVICE", label: "Matériel médical" },
  { value: "OTHER", label: "Autre" },
];

export const TARGET_GENDERS: ProductFormOption[] = [
  { value: "MALE", label: "Homme" },
  { value: "FEMALE", label: "Femme" },
  { value: "MIXED", label: "Mixte" },
  { value: "UNDEFINED", label: "Non défini" },
];

export const TARGET_AGE_GROUPS: ProductFormOption[] = [
  { value: "NEWBORN", label: "Nourrisson" },
  { value: "CHILD", label: "Enfant" },
  { value: "ADOLESCENT", label: "Adolescent" },
  { value: "ADULT", label: "Adulte" },
  { value: "ELDERLY", label: "Personne âgée" },
  { value: "ALL", label: "Tous âges" },
];

export const THERAPEUTIC_CATEGORIES: ProductFormOption[] = [
  { value: "ANALGESIC", label: "Antalgique" },
  { value: "ANTIBIOTIC", label: "Antibiotique" },
  { value: "ANTIINFLAMMATORY", label: "Anti-inflammatoire" },
  { value: "ANTIMALARIAL", label: "Antipaludique" },
  { value: "ANTIFUNGAL", label: "Antifongique" },
  { value: "ANTIVIRAL", label: "Antiviral" },
  { value: "ANTIHYPERTENSIVE", label: "Antihypertenseur" },
  { value: "ANTIDIABETIC", label: "Antidiabétique" },
  { value: "ANTIHISTAMINE", label: "Antihistaminique" },
  { value: "ANTIPARASITIC", label: "Antiparasitaire" },
  { value: "ANTITUSSIVE", label: "Antitussif" },
  { value: "ANTISEPTIC", label: "Antiseptique" },
  { value: "VITAMIN", label: "Vitamine" },
  { value: "CONTRACEPTIVE", label: "Contraceptif" },
  { value: "MEDICAL_DEVICE", label: "Dispositif médical" },
  { value: "OTHER", label: "Autre" },
];

export const initialProductFormValues: ProductFormValues = {
  name: "",
  description: "",
  form: PRODUCT_FORM_DEFAULT,
  target_gender: TARGET_GENDER_DEFAULT,
  target_age_group: TARGET_AGE_GROUP_DEFAULT,
  therapeutic_category: THERAPEUTIC_CATEGORY_DEFAULT,
  strength: "",
  package: "",
  sale_price: "",
  purchase_price: "",
  current_stock: "0",
  created_date: "",
  expiration_date: "",
};

export async function createProduct(
  pharmacyId: string,
  values: ProductFormValues,
): Promise<Product> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const payload: CreateProductPayload = {
    pharmacy_reference: pharmacyId,
    name: values.name.trim(),
    form: values.form,
    target_gender: values.target_gender,
    target_age_group: values.target_age_group,
    therapeutic_category: values.therapeutic_category,
    sale_price: Number(values.sale_price),
  };

  if (values.description.trim()) {
    payload.description = values.description.trim();
  }
  if (values.strength.trim()) {
    payload.strength = values.strength.trim();
  }
  if (values.package.trim()) {
    payload.package = values.package.trim();
  }
  if (values.purchase_price.trim()) {
    payload.purchase_price = Number(values.purchase_price);
  }
  if (values.current_stock.trim()) {
    payload.current_stock = Number(values.current_stock);
  }
  if (values.expiration_date.trim()) {
    payload.expiration_date = values.expiration_date.trim();
  }
  if (values.created_date.trim()) {
    payload.created_date = values.created_date.trim();
  }

  const response = await apiFetch(apiBaseUrl.replace(/\/$/, "") + "/api/products/", {
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
    throw new Error(getApiErrorMessage(data, "Impossible de créer le produit."));
  }

  if (!data || typeof data !== "object") {
    throw new Error("Le produit a été créé, mais la réponse du serveur est invalide.");
  }

  return data as Product;
}

export async function getProductDetail(
  pharmacyId: string,
  reference: string,
): Promise<Product> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const params = new URLSearchParams({ pharmacy_reference: pharmacyId });
  const url =
    apiBaseUrl.replace(/\/$/, "") + "/api/products/" + reference + "/?" + params.toString();

  const response = await apiFetch(url, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
    },
  });

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de charger ce produit."));
  }

  if (!data || typeof data !== "object") {
    throw new Error("La réponse du serveur est invalide.");
  }

  return data as Product;
}

export async function deleteProduct(
  pharmacyId: string,
  reference: string,
): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const params = new URLSearchParams({ pharmacy_reference: pharmacyId });
  const url =
    apiBaseUrl.replace(/\/$/, "") + "/api/products/" + reference + "/?" + params.toString();

  const response = await apiFetch(url, {
    method: "DELETE",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
    },
  });

  if (response.status === 204) {
    return;
  }

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Impossible de supprimer ce produit."));
  }
}

export async function updateProduct(
  pharmacyId: string,
  reference: string,
  values: ProductFormValues,
): Promise<Product> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  // PATCH partiel: on n'envoie que les champs renseignés. Les dates sont
  // envoyées en chaîne pour définir une valeur, ou en null pour l'effacer.
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    form: values.form,
    target_gender: values.target_gender,
    target_age_group: values.target_age_group,
    therapeutic_category: values.therapeutic_category,
    created_date: values.created_date.trim() ? values.created_date.trim() : null,
    expiration_date: values.expiration_date.trim()
      ? values.expiration_date.trim()
      : null,
  };

  if (values.description.trim()) {
    payload.description = values.description.trim();
  }
  if (values.strength.trim()) {
    payload.strength = values.strength.trim();
  }
  if (values.package.trim()) {
    payload.package = values.package.trim();
  }
  if (values.sale_price.trim()) {
    payload.sale_price = Number(values.sale_price);
  }
  if (values.purchase_price.trim()) {
    payload.purchase_price = Number(values.purchase_price);
  }
  if (values.current_stock.trim()) {
    payload.current_stock = Number(values.current_stock);
  }

  const params = new URLSearchParams({ pharmacy_reference: pharmacyId });
  const url =
    apiBaseUrl.replace(/\/$/, "") + "/api/products/" + reference + "/?" + params.toString();

  const response = await apiFetch(url, {
    method: "PATCH",
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
    throw new Error(getApiErrorMessage(data, "Impossible de modifier le produit."));
  }

  if (!data || typeof data !== "object") {
    throw new Error("La réponse du serveur est invalide.");
  }

  return data as Product;
}

export type ProductExportFormat = "pdf" | "excel";

// Liste unique des filtres produits acceptés par les endpoints d'export.
// `page` est volontairement exclu pour télécharger tous les résultats filtrés.
const PRODUCT_EXPORT_FILTERS: [keyof ProductFilters, string][] = [
  ["search", "search"],
  ["reference", "reference"],
  ["name", "name"],
  ["form", "form"],
  ["targetGender", "target_gender"],
  ["targetAgeGroup", "target_age_group"],
  ["therapeuticCategory", "therapeutic_category"],
  ["strength", "strength"],
  ["package", "package"],
  ["stockStatus", "stock_status"],
  ["minStock", "min_stock"],
  ["maxStock", "max_stock"],
  ["minSalePrice", "min_sale_price"],
  ["maxSalePrice", "max_sale_price"],
  ["minPurchasePrice", "min_purchase_price"],
  ["maxPurchasePrice", "max_purchase_price"],
  ["createdFrom", "created_from"],
  ["createdTo", "created_to"],
  ["updatedFrom", "updated_from"],
  ["updatedTo", "updated_to"],
  ["ordering", "ordering"],
];

function appendProductExportFilters(params: URLSearchParams, filters: ProductFilters) {
  // Chaque filtre est ajouté seulement s'il contient une valeur réelle.
  for (const [frontendName, apiName] of PRODUCT_EXPORT_FILTERS) {
    const value = filters[frontendName];
    if (value && value.trim()) {
      params.set(apiName, value.trim());
    }
  }
}

function getFilenameFromDisposition(disposition: string | null, fallback: string) {
  // Le backend renvoie un Content-Disposition simple avec filename="...".
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

function saveBlob(blob: Blob, filename: string) {
  // URL objet temporaire: elle permet un téléchargement authentifié côté client.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadProductExport(
  pharmacyId: string,
  format: ProductExportFormat,
  filters: ProductFilters = {},
): Promise<string> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Session introuvable. Reconnectez-vous avec Carri Account.");
  }

  const params = new URLSearchParams({ pharmacy_reference: pharmacyId });
  appendProductExportFilters(params, filters);

  const endpoint = format === "pdf" ? "/api/products/export/pdf/" : "/api/products/export/excel/";
  const response = await apiFetch(
    apiBaseUrl.replace(/\/$/, "") + endpoint + "?" + params.toString(),
    {
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + accessToken,
        // L'endpoint renvoie le vrai Content-Type du fichier; `*/*` laisse
        // aussi le backend retourner une erreur JSON lisible en cas de 403.
        Accept: "*/*",
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    const data = parseJsonResponse(responseText);
    throw new Error(
      getApiErrorMessage(
        data,
        format === "pdf"
          ? "Impossible de générer l'export PDF."
          : "Impossible de générer l'export Excel.",
      ),
    );
  }

  const fallbackFilename = format === "pdf" ? "produits.pdf" : "produits.xlsx";
  const filename = getFilenameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFilename,
  );
  const blob = await response.blob();
  saveBlob(blob, filename);
  return filename;
}
