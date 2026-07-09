"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getProductDetail,
  PRODUCT_FORMS,
  TARGET_AGE_GROUPS,
  TARGET_GENDERS,
  THERAPEUTIC_CATEGORIES,
  type Product,
} from "@/lib/api/products";

type DetailPageProps = {
  params: Promise<{ pharmacyId: string; reference: string }>;
};

type PageState = "loading" | "error" | "ready";

const productsPath = (pharmacyId: string) =>
  "/app/pharmacies/" + pharmacyId + "/products";

export default function ProductDetailPage({ params }: DetailPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [reference, setReference] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

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
      setState("loading");
      setErrorMessage("");

      try {
        const data = await getProductDetail(pharmacyId, reference);
        setProduct(data);
        setState("ready");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger ce produit.",
        );
        setState("error");
      }
    }

    loadProduct();
  }, [pharmacyId, reference]);

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary-700">Produits</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Détail du produit</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Toutes les informations enregistrées pour ce produit.
            </p>
          </div>
          <LinkButton href={productsPath(pharmacyId)} variant="secondary" className="self-start">
            Retour
          </LinkButton>
        </header>

        <section className="py-8">
          {state === "loading" && <LoadingBubble label="Chargement du produit" />}

          {state === "error" && (
            <div className="rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
              <p className="text-sm font-semibold text-red-600">Erreur</p>
              <h2 className="mt-2 text-2xl font-bold text-app-text">Produit indisponible</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-app-muted">
                {errorMessage}
              </p>
              <LinkButton href={productsPath(pharmacyId)} variant="secondary" className="mt-5">
                Retour
              </LinkButton>
            </div>
          )}

          {state === "ready" && product && (
            <DetailCard product={product} pharmacyId={pharmacyId} />
          )}
        </section>
      </main>
    </>
  );
}

function DetailCard({ product, pharmacyId }: { product: Product; pharmacyId: string }) {
  const basePath = productsPath(pharmacyId) + "/" + product.reference;

  return (
    <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-app-text">{product.name}</h2>
        <p className="mt-1 text-sm font-semibold text-app-muted">
          Référence {product.reference}
        </p>
      </div>

      {product.description && (
        <p className="mt-4 text-sm leading-6 text-app-muted">{product.description}</p>
      )}

      <dl className="mt-6 grid gap-4 border-t border-app-border pt-6 sm:grid-cols-2">
        <DetailRow label="Forme" value={labelFor(PRODUCT_FORMS, product.form)} />
        <DetailRow label="Catégorie thérapeutique" value={labelFor(THERAPEUTIC_CATEGORIES, product.therapeutic_category)} />
        <DetailRow label="Public visé" value={labelFor(TARGET_GENDERS, product.target_gender)} />
        <DetailRow label="Tranche d'âge" value={labelFor(TARGET_AGE_GROUPS, product.target_age_group)} />
        <DetailRow label="Prix de vente" value={formatCurrency(product.sale_price)} />
        <DetailRow
          label="Prix d'achat"
          value={
            product.purchase_price === null || product.purchase_price === undefined
              ? "Non renseigné"
              : formatCurrency(product.purchase_price)
          }
        />
        <DetailRow label="Stock actuel" value={String(product.current_stock)} />
        <DetailRow label="Statut" value={product.is_deleted ? "Supprimé" : "Actif"} />
        <DetailRow label="Créé le" value={formatDateTime(product.created_at)} />
        <DetailRow label="Modifié le" value={formatDateTime(product.updated_at)} />
      </dl>

      <div className="mt-6 flex flex-col gap-3 border-t border-app-border pt-6 sm:flex-row">
        <LinkButton href={basePath + "/edit"} variant="secondary">
          Modifier
        </LinkButton>
        <LinkButton href={basePath + "/delete"} variant="secondary">
          Supprimer
        </LinkButton>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-app-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-app-text">{value}</dd>
    </div>
  );
}

function labelFor(
  options: { value: string; label: string }[],
  value?: string,
): string {
  if (!value) {
    return "Non renseigné";
  }
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
