import { getAccessToken } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/carri-account";
import { getApiErrorMessage, parseJsonResponse } from "@/lib/api";

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
  sale_price: number;
  purchase_price?: number | null;
  current_stock?: number;
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
  sale_price: number;
  purchase_price?: number | null;
  current_stock: number;
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
  sale_price: string;
  purchase_price: string;
  current_stock: string;
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
  sale_price: "",
  purchase_price: "",
  current_stock: "0",
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
  if (values.purchase_price.trim()) {
    payload.purchase_price = Number(values.purchase_price);
  }
  if (values.current_stock.trim()) {
    payload.current_stock = Number(values.current_stock);
  }

  const response = await fetch(apiBaseUrl.replace(/\/$/, "") + "/api/products/", {
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
