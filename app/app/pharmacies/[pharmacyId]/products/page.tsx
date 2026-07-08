"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getPharmacyProducts, type ProductSummary } from "@/lib/api";

type ProductsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "empty" | "ready";

export default function PharmacyProductsPage({ params }: ProductsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }

    readParams();
  }, [params]);

  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    async function loadProducts() {
      setState("loading");
      setErrorMessage("");

      try {
        const rows = await getPharmacyProducts(pharmacyId);
        setProducts(rows);
        setState(rows.length ? "ready" : "empty");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les produits.");
        setState("error");
      }
    }

    loadProducts();
  }, [pharmacyId]);

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + product.currentStock, 0),
    [products],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary-700">Produits</p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">Liste des produits</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
            Consultez tous les produits enregistrés pour cette pharmacie.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SummaryPill label="Produits" value={String(products.length)} />
          <SummaryPill label="Stock total" value={String(totalStock)} />
        </div>
      </header>

      <section className="py-8">
        {state === "loading" && <LoadingBubble label="Chargement des produits" />}
        {state === "error" && <ErrorState message={errorMessage} pharmacyId={pharmacyId} />}
        {state === "empty" && <EmptyState pharmacyId={pharmacyId} />}
        {state === "ready" && <ProductsList products={products} />}
      </section>
    </main>
  );
}

function ProductsList({ products }: { products: ProductSummary[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
      <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.8fr] gap-4 border-b border-app-border bg-app-surface px-5 py-3 text-xs font-bold uppercase text-app-muted md:grid">
        <span>Produit</span>
        <span>Catégorie</span>
        <span>Forme</span>
        <span className="text-right">Stock</span>
        <span className="text-right">Prix vente</span>
      </div>

      <div className="divide-y divide-app-border">
        {products.map((product) => (
          <article
            key={product.reference}
            className="grid gap-4 px-5 py-4 md:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.8fr] md:items-center"
          >
            <div className="min-w-0">
              <h2 className="truncate font-bold text-app-text">{product.name}</h2>
              <p className="mt-1 text-xs font-semibold text-app-muted">
                Référence {product.reference}
              </p>
              {product.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-app-muted">
                  {product.description}
                </p>
              )}
            </div>

            <InfoCell label="Catégorie" value={formatValue(product.therapeuticCategory)} />
            <InfoCell label="Forme" value={formatValue(product.form)} />
            <InfoCell
              label="Stock"
              value={String(product.currentStock)}
              alignRight
              tone={product.currentStock > 0 ? "default" : "warning"}
            />
            <InfoCell
              label="Prix vente"
              value={formatCurrency(product.salePrice)}
              alignRight
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card px-4 py-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-app-text">{value}</p>
    </div>
  );
}

function InfoCell({
  label,
  value,
  alignRight = false,
  tone = "default",
}: {
  label: string;
  value: string;
  alignRight?: boolean;
  tone?: "default" | "warning";
}) {
  return (
    <div className={alignRight ? "md:text-right" : ""}>
      <p className="text-xs font-semibold text-app-muted md:hidden">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold md:mt-0 ${
          tone === "warning" ? "text-red-600" : "text-app-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Aucun produit</p>
      <h2 className="mt-2 text-2xl font-bold text-app-text">Aucun produit enregistré</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
        Cette pharmacie n’a pas encore de produits visibles dans son catalogue.
      </p>
      <LinkButton
        href={"/app/pharmacies/" + pharmacyId + "/products/create"}
        className="mt-5"
      >
        Ajouter un produit
      </LinkButton>
    </div>
  );
}

function ErrorState({ message, pharmacyId }: { message: string; pharmacyId: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Erreur</p>
      <h2 className="mt-2 text-2xl font-bold text-app-text">Produits indisponibles</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton
        href={"/app/pharmacies/" + pharmacyId + "/dashboard"}
        variant="secondary"
        className="mt-5"
      >
        Retour au dashboard
      </LinkButton>
    </div>
  );
}

function formatValue(value?: string) {
  return value || "Non renseigné";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
