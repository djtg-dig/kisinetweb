"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getProductDetail,
  initialProductFormValues,
  PRODUCT_FORMS,
  TARGET_AGE_GROUPS,
  TARGET_GENDERS,
  THERAPEUTIC_CATEGORIES,
  updateProduct,
  type Product,
  type ProductFormValues,
} from "@/lib/api/products";

type EditPageProps = {
  params: Promise<{ pharmacyId: string; reference: string }>;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const productsPath = (pharmacyId: string, reference: string) =>
  "/app/pharmacies/" + pharmacyId + "/products/" + reference;

export default function EditProductPage({ params }: EditPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [reference, setReference] = useState("");
  const [values, setValues] = useState<ProductFormValues>(initialProductFormValues);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
      setReference(resolvedParams.reference);
    }

    readParams();
  }, [params]);

  useEffect(() => {
    if (!pharmacyId || !reference) {
      return;
    }

    async function loadProduct() {
      setErrorMessage("");
      setDataLoaded(false);

      try {
        const data = await getProductDetail(pharmacyId, reference);
        setValues({
          name: data.name,
          description: data.description || "",
          form: data.form || PRODUCT_FORMS[0]?.value || "",
          target_gender: data.target_gender || TARGET_GENDERS[0]?.value || "",
          target_age_group: data.target_age_group || TARGET_AGE_GROUPS[0]?.value || "",
          therapeutic_category: data.therapeutic_category || THERAPEUTIC_CATEGORIES[0]?.value || "",
          strength: data.strength || "",
          package: data.package || "",
          sale_price: String(data.sale_price),
          purchase_price: data.purchase_price === null || data.purchase_price === undefined ? "" : String(data.purchase_price),
          current_stock: String(data.current_stock ?? "0"),
          expiration_date: data.expiration_date || "",
        });
        setDataLoaded(true);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger ce produit.",
        );
        setDataLoaded(true);
      }
    }

    loadProduct();
  }, [pharmacyId, reference]);

  function updateField(name: keyof ProductFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!values.name.trim()) {
      errors.name = "Le nom du produit est obligatoire.";
    }

    if (!values.sale_price.trim()) {
      errors.sale_price = "Le prix de vente est obligatoire.";
    } else if (Number.isNaN(Number(values.sale_price)) || Number(values.sale_price) < 0) {
      errors.sale_price = "Le prix de vente doit être un nombre positif.";
    }

    if (
      values.purchase_price.trim() &&
      (Number.isNaN(Number(values.purchase_price)) || Number(values.purchase_price) < 0)
    ) {
      errors.purchase_price = "Le prix d'achat doit être un nombre positif.";
    }

    if (
      values.current_stock.trim() &&
      (!Number.isInteger(Number(values.current_stock)) || Number(values.current_stock) < 0)
    ) {
      errors.current_stock = "Le stock doit être un nombre entier positif.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    setStatus("submitting");

    try {
      await updateProduct(pharmacyId, reference, values);
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de modifier ce produit.",
      );
      setStatus("error");
    }
  }

  if (!dataLoaded) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary-700">Produits</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Modifier le produit</h1>
          </div>
        </header>
        <section className="py-8">
          <LoadingBubble label="Chargement du produit" />
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b border-app-border pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-700">Produits</p>
              <h1 className="mt-2 text-3xl font-bold text-app-text">Modifier le produit</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
                Modifiez les informations du produit pour cette pharmacie.
              </p>
            </div>
            <LinkButton href={productsPath(pharmacyId, reference)} variant="secondary" className="self-start">
              Retour
            </LinkButton>
          </div>
        </header>

        <section className="py-8">
          {status === "error" && errorMessage && (
            <div className="mb-6 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-600">Erreur</p>
              <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {status === "success" && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-700">Produit modifié</p>
              <p className="mt-1 text-sm text-green-700">
                Les modifications ont bien été enregistrées.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <LinkButton href={productsPath(pharmacyId, reference)} variant="secondary">
                  Voir le produit
                </LinkButton>
                <LinkButton href={"/app/pharmacies/" + pharmacyId + "/products"} variant="secondary">
                  Retour à la liste
                </LinkButton>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="grid gap-5 rounded-lg border border-app-border bg-app-card p-6 shadow-sm"
          >
            <TextField
              label="Nom du produit *"
              value={values.name}
              placeholder="Ex : Paracétamol 500mg"
              onChange={(value) => updateField("name", value)}
              error={fieldErrors.name}
            />

            <TextAreaField
              label="Description"
              value={values.description}
              placeholder="Indications, posologie, remarques..."
              onChange={(value) => updateField("description", value)}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Dosage / concentration"
                value={values.strength}
                placeholder="Ex : 500 mg, 250 mg/5 ml"
                onChange={(value) => updateField("strength", value)}
              />
              <TextField
                label="Conditionnement"
                value={values.package}
                placeholder="Ex : Boîte de 10 comprimés"
                onChange={(value) => updateField("package", value)}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Forme"
                value={values.form}
                options={PRODUCT_FORMS}
                onChange={(value) => updateField("form", value)}
              />
              <SelectField
                label="Catégorie thérapeutique"
                value={values.therapeutic_category}
                options={THERAPEUTIC_CATEGORIES}
                onChange={(value) => updateField("therapeutic_category", value)}
              />
              <SelectField
                label="Public visé"
                value={values.target_gender}
                options={TARGET_GENDERS}
                onChange={(value) => updateField("target_gender", value)}
              />
              <SelectField
                label="Tranche d'âge"
                value={values.target_age_group}
                options={TARGET_AGE_GROUPS}
                onChange={(value) => updateField("target_age_group", value)}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <NumberField
                label="Prix de vente *"
                value={values.sale_price}
                placeholder="0.00"
                onChange={(value) => updateField("sale_price", value)}
                error={fieldErrors.sale_price}
              />
              <NumberField
                label="Prix d'achat"
                value={values.purchase_price}
                placeholder="0.00"
                onChange={(value) => updateField("purchase_price", value)}
                error={fieldErrors.purchase_price}
              />
              <NumberField
                label="Stock"
                value={values.current_stock}
                placeholder="0"
                onChange={(value) => updateField("current_stock", value)}
                error={fieldErrors.current_stock}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <TextField
                label="Date de péremption"
                value={values.expiration_date}
                placeholder="AAAA-MM-JJ"
                onChange={(value) => updateField("expiration_date", value)}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <LinkButton
                href={productsPath(pharmacyId, reference)}
                variant="secondary"
                className="sm:order-1"
              >
                Annuler
              </LinkButton>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(false) + " resize-y"}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(false)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function inputClass(hasError: boolean) {
  const base =
    "min-h-11 rounded-md border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:ring-4 focus:ring-primary-100";
  const border = hasError
    ? "border-red-300 focus:border-red-400"
    : "border-app-border focus:border-primary-300";
  return base + " " + border;
}
