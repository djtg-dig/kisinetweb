"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import {
  createProduct,
  initialProductFormValues,
  PRODUCT_FORMS,
  TARGET_AGE_GROUPS,
  TARGET_GENDERS,
  THERAPEUTIC_CATEGORIES,
  type ProductFormValues,
} from "@/lib/api/products";

type CreatePageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const productsPath = (pharmacyId: string) =>
  "/app/pharmacies/" + pharmacyId + "/products";

export default function CreateProductPage({ params }: CreatePageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [values, setValues] = useState<ProductFormValues>(initialProductFormValues);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }

    readParams();
  }, [params]);

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
      errors.current_stock = "Le stock initial doit être un nombre entier positif.";
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
      await createProduct(pharmacyId, values);
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de créer le produit.",
      );
      setStatus("error");
    }
  }

  // Réinitialise le formulaire pour enchaîner sur un nouveau produit.
  function handleAddAnother() {
    setValues(initialProductFormValues);
    setFieldErrors({});
    setErrorMessage("");
    setStatus("idle");
  }

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="grid gap-5 border-b border-app-border pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">Produits</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Ajouter un produit</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Renseignez les informations du produit à ajouter dans cette pharmacie.
            </p>
          </div>
          <LinkButton href={productsPath(pharmacyId)} variant="secondary" className="self-start">
            Retour
          </LinkButton>
        </div>
      </header>

      <section className="py-8">
        {status === "success" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-700">Produit créé</p>
            <p className="mt-1 text-sm text-green-700">
              Le produit a bien été enregistré.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={productsPath(pharmacyId)} variant="secondary">
                Retour
              </LinkButton>
              <button
                type="button"
                onClick={handleAddAnother}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200"
              >
                Ajouter un autre produit
              </button>
            </div>
          </div>
        )}

        {status === "error" && errorMessage && (
          <div className="mb-6 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-600">Erreur</p>
            <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
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
              label="Stock initial"
              value={values.current_stock}
              placeholder="0"
              onChange={(value) => updateField("current_stock", value)}
              error={fieldErrors.current_stock}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <LinkButton
              href={productsPath(pharmacyId)}
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
