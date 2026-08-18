"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { ToastMessage } from "@/components/ui/toast";
import {
  DateField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/products/product-form-fields";
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
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
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

    // La date d'expiration ne peut pas être antérieure à la date de création.
    if (
      values.created_date.trim() &&
      values.expiration_date.trim() &&
      values.expiration_date < values.created_date
    ) {
      errors.expiration_date =
        "La date d'expiration ne peut pas être antérieure à la date de création.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setStatus("submitting");

    try {
      await createProduct(pharmacyId, values);
      // Création réussie : on vide le formulaire et on affiche un toast auto-fermant.
      setValues(initialProductFormValues);
      setFieldErrors({});
      setToast({ tone: "success", message: "Produit créé avec succès." });
      setStatus("idle");
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible de créer le produit.",
      });
      setStatus("idle");
    }
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
        {toast && (
          <ToastMessage tone={toast.tone} onClose={() => setToast(null)}>
            {toast.message}
          </ToastMessage>
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
              label="Stock initial"
              value={values.current_stock}
              placeholder="0"
              onChange={(value) => updateField("current_stock", value)}
              error={fieldErrors.current_stock}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <DateField
              label="Date de création"
              value={values.created_date}
              onChange={(value) => updateField("created_date", value)}
            />
            <DateField
              label="Date de péremption"
              value={values.expiration_date}
              onChange={(value) => updateField("expiration_date", value)}
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
