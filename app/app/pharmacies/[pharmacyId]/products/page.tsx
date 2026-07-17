"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getPharmacyProducts,
  getPharmacyPermissions,
  getProductFilterOptions,
  type FilterOption,
  type PharmacyPermissions,
  type ProductFilterOptions,
  type ProductFilters,
  type ProductSummary,
} from "@/lib/api";
import { deleteProduct } from "@/lib/api/products";

type ProductsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "empty" | "ready";

const defaultFilters: ProductFilters = {
  ordering: "name",
};

export default function PharmacyProductsPage({ params }: ProductsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptions>({
    forms: [],
    targetGenders: [],
    targetAgeGroups: [],
    therapeuticCategories: [],
    stockStatuses: [],
    orderings: [],
  });
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingReference, setDeletingReference] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ProductSummary | null>(null);

  function handleDeleteProduct(product: ProductSummary) {
    setPendingDelete(product);
  }

  async function confirmDeleteProduct() {
    if (!pendingDelete) {
      return;
    }

    setDeletingReference(pendingDelete.reference);
    setErrorMessage("");

    try {
      await deleteProduct(pharmacyId, pendingDelete.reference);
      setReloadKey((key) => key + 1);
      setPendingDelete(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de supprimer ce produit.");
      setPendingDelete(null);
    } finally {
      setDeletingReference("");
    }
  }

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
        const [page, options, pharmacyPermissions] = await Promise.all([
          getPharmacyProducts(pharmacyId, filters),
          getProductFilterOptions(pharmacyId),
          getPharmacyPermissions(pharmacyId),
        ]);
        setProducts(page.results);
        setTotalProducts(page.count);
        setHasNextPage(Boolean(page.next));
        setHasPreviousPage(Boolean(page.previous));
        setFilterOptions(options);
        setPermissions(pharmacyPermissions);
        setState(page.results.length ? "ready" : "empty");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les produits.");
        setState("error");
      }
    }

    loadProducts();
  }, [pharmacyId, filters, reloadKey]);

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + product.currentStock, 0),
    [products],
  );
  const pageCount = Math.max(1, Math.ceil(totalProducts / 10));

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary-700">Produits</p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">Liste des produits</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
            Consultez tous les produits enregistrés pour cette pharmacie.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {pharmacyId && (
            <AddProductButton
              canCreate={Boolean(permissions.product_create)}
              pharmacyId={pharmacyId}
            />
          )}
          <SummaryPill label="Produits" value={String(products.length)} />
          <SummaryPill label="Stock total" value={String(totalStock)} />
        </div>
      </header>

      <section className="py-8">
        {pharmacyId && (
          <ProductFiltersPanel
            filters={draftFilters}
            options={filterOptions}
            onChange={setDraftFilters}
            onApply={() => {
              setCurrentPage(1);
              setFilters(cleanFilters({ ...draftFilters, page: "1" }));
            }}
            onReset={() => {
              setCurrentPage(1);
              setDraftFilters(defaultFilters);
              setFilters({ ...defaultFilters, page: "1" });
            }}
          />
        )}
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement des produits" className="min-h-[220px]" />
          </section>
        )}
        {state === "error" && <ErrorState message={errorMessage} pharmacyId={pharmacyId} />}
        {state === "empty" && (
          <EmptyState
            canCreate={Boolean(permissions.product_create)}
            pharmacyId={pharmacyId}
          />
        )}
        {state === "ready" && errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          </div>
        )}
        {state === "ready" && (
          <>
            <ProductsList
              permissions={permissions}
              products={products}
              pharmacyId={pharmacyId}
              onDelete={handleDeleteProduct}
              deletingReference={deletingReference}
            />
            <PaginationControls
              currentPage={currentPage}
              pageCount={pageCount}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setFilters((current) => ({ ...current, page: String(page) }));
              }}
            />
          </>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer le produit"
        message={
          pendingDelete
            ? `Voulez-vous vraiment supprimer le produit « ${pendingDelete.name} » ? Ce produit sera déplacé dans la corbeille.`
            : ""
        }
        confirmLabel="Supprimer"
        loading={deletingReference !== ""}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

function ProductFiltersPanel({
  filters,
  options,
  onChange,
  onApply,
  onReset,
}: {
  filters: ProductFilters;
  options: ProductFilterOptions;
  onChange: (filters: ProductFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  function updateFilter(name: keyof ProductFilters, value: string) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <section className="mb-6 rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterInput
          label="Recherche"
          value={filters.search || ""}
          placeholder="Nom, référence, dosage..."
          onChange={(value) => updateFilter("search", value)}
        />
        <FilterSelect
          label="Catégorie"
          value={filters.therapeuticCategory || ""}
          options={options.therapeuticCategories}
          onChange={(value) => updateFilter("therapeuticCategory", value)}
        />
        <FilterSelect
          label="Forme"
          value={filters.form || ""}
          options={options.forms}
          onChange={(value) => updateFilter("form", value)}
        />
        <FilterSelect
          label="Tri"
          value={filters.ordering || "name"}
          options={options.orderings}
          onChange={(value) => updateFilter("ordering", value || "name")}
        />
      </div>

      {showAdvancedFilters && (
        <div className="mt-4 grid gap-3 border-t border-app-border pt-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput
            label="Référence"
            value={filters.reference || ""}
            placeholder="PR..."
            onChange={(value) => updateFilter("reference", value)}
          />
          <FilterInput
            label="Dosage"
            value={filters.strength || ""}
            placeholder="500 mg"
            onChange={(value) => updateFilter("strength", value)}
          />
          <FilterInput
            label="Conditionnement"
            value={filters.package || ""}
            placeholder="Boîte, flacon..."
            onChange={(value) => updateFilter("package", value)}
          />
          <FilterSelect
            label="Public"
            value={filters.targetGender || ""}
            options={options.targetGenders}
            onChange={(value) => updateFilter("targetGender", value)}
          />
          <FilterSelect
            label="Âge"
            value={filters.targetAgeGroup || ""}
            options={options.targetAgeGroups}
            onChange={(value) => updateFilter("targetAgeGroup", value)}
          />
          <FilterSelect
            label="Stock"
            value={filters.stockStatus || ""}
            options={options.stockStatuses}
            onChange={(value) => updateFilter("stockStatus", value)}
          />
          <FilterInput
            label="Stock min."
            value={filters.minStock || ""}
            type="number"
            onChange={(value) => updateFilter("minStock", value)}
          />
          <FilterInput
            label="Stock max."
            value={filters.maxStock || ""}
            type="number"
            onChange={(value) => updateFilter("maxStock", value)}
          />
          <FilterInput
            label="Prix vente min."
            value={filters.minSalePrice || ""}
            type="number"
            onChange={(value) => updateFilter("minSalePrice", value)}
          />
          <FilterInput
            label="Prix vente max."
            value={filters.maxSalePrice || ""}
            type="number"
            onChange={(value) => updateFilter("maxSalePrice", value)}
          />
          <FilterInput
            label="Prix achat min."
            value={filters.minPurchasePrice || ""}
            type="number"
            onChange={(value) => updateFilter("minPurchasePrice", value)}
          />
          <FilterInput
            label="Prix achat max."
            value={filters.maxPurchasePrice || ""}
            type="number"
            onChange={(value) => updateFilter("maxPurchasePrice", value)}
          />
          <FilterInput
            label="Créé depuis"
            value={filters.createdFrom || ""}
            type="date"
            onChange={(value) => updateFilter("createdFrom", value)}
          />
          <FilterInput
            label="Créé jusqu'au"
            value={filters.createdTo || ""}
            type="date"
            onChange={(value) => updateFilter("createdTo", value)}
          />
          <FilterInput
            label="Modifié depuis"
            value={filters.updatedFrom || ""}
            type="date"
            onChange={(value) => updateFilter("updatedFrom", value)}
          />
          <FilterInput
            label="Modifié jusqu'au"
            value={filters.updatedTo || ""}
            type="date"
            onChange={(value) => updateFilter("updatedTo", value)}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200"
        >
          Rechercher
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={() => setShowAdvancedFilters((current) => !current)}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
        >
          {showAdvancedFilters ? "Masquer les filtres avancés" : "Filtres avancés"}
        </button>
      </div>
    </section>
  );
}

function ProductsList({
  permissions,
  products,
  pharmacyId,
  onDelete,
  deletingReference,
}: {
  permissions: PharmacyPermissions;
  products: ProductSummary[];
  pharmacyId: string;
  onDelete: (product: ProductSummary) => void;
  deletingReference: string;
}) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card shadow-sm">
      <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-4 rounded-t-lg border-b border-app-border bg-app-surface px-5 py-3 text-xs font-bold uppercase text-app-muted lg:grid">
        <span>Produit</span>
        <span>Catégorie</span>
        <span>Dosage</span>
        <span>Forme</span>
        <span className="text-right">Stock</span>
        <span className="text-right">Prix vente</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-app-border">
        {products.map((product, index) => (
          <article
            key={product.reference}
            className="grid gap-4 px-5 py-4 lg:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] lg:items-center"
          >
            <div className="min-w-0">
              <h2 className="truncate font-bold text-app-text">{product.name}</h2>
              <p className="mt-1 text-xs font-semibold text-app-muted">
                ID : {product.reference}
              </p>
              {product.package && (
                <p className="mt-1 truncate text-xs font-semibold text-app-muted">
                  {product.package}
                </p>
              )}
            </div>

            <InfoCell label="Catégorie" value={formatValue(product.therapeuticCategory)} />
            <InfoCell label="Dosage" value={formatValue(product.strength)} />
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
            <ProductActions
              permissions={permissions}
              pharmacyId={pharmacyId}
              product={product}
              onDelete={onDelete}
              isDeleting={deletingReference === product.reference}
              isLast={index === products.length - 1}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
      >
        <option value="">Tous</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function AddProductButton({
  canCreate,
  pharmacyId,
}: {
  canCreate: boolean;
  pharmacyId: string;
}) {
  const href = "/app/pharmacies/" + pharmacyId + "/products/create";

  if (canCreate) {
    return (
      <LinkButton href={href} className="sm:self-stretch">
        Ajouter un produit
      </LinkButton>
    );
  }

  return (
    <span
      aria-disabled="true"
      className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-muted opacity-60 sm:self-stretch"
      title="Vous n'avez pas la permission d'ajouter un produit dans cette pharmacie."
    >
      Ajouter un produit
    </span>
  );
}

function ProductActions({
  permissions,
  pharmacyId,
  product,
  onDelete,
  isDeleting,
  isLast,
}: {
  permissions: PharmacyPermissions;
  pharmacyId: string;
  product: ProductSummary;
  onDelete: (product: ProductSummary) => void;
  isDeleting: boolean;
  isLast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const basePath = "/app/pharmacies/" + pharmacyId + "/products/" + product.reference;
  const actions = [
    {
      label: "Modifier",
      href: basePath + "/edit",
      enabled: Boolean(permissions.product_update),
    },
    {
      label: "Supprimer",
      isDelete: true,
      enabled: Boolean(permissions.product_delete),
    },
    {
      label: "Voir",
      href: basePath,
      enabled: Boolean(permissions.product_view),
    },
  ];

  return (
    <div className="relative lg:text-right">
      <p className="text-xs font-semibold text-app-muted lg:hidden">Action</p>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
        className="mt-2 inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-xs font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 lg:mt-0"
      >
        Actions
        <span aria-hidden="true" className="text-[10px] text-app-muted">
          ▼
        </span>
      </button>
      {isOpen && (
        <div
          role="menu"
          className={`absolute right-auto z-20 mt-2 w-44 overflow-hidden rounded-lg border border-app-border bg-app-card py-2 text-sm shadow-soft lg:right-0 ${
            isLast ? "bottom-full mb-2 mt-0" : ""
          }`}
        >
          {actions.map((action) =>
            action.enabled ? (
              action.isDelete ? (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  disabled={isDeleting}
                  onClick={() => onDelete(product)}
                  className="block w-full px-4 py-2.5 text-left font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Suppression..." : action.label}
                </button>
              ) : (
                <a
                  key={action.label}
                  role="menuitem"
                  href={action.href}
                  className="block px-4 py-2.5 font-semibold text-app-text transition hover:bg-primary-50 hover:text-primary-700"
                >
                  {action.label}
                </a>
              )
            ) : (
              <span
                key={action.label}
                aria-disabled="true"
                role="menuitem"
                className="block cursor-not-allowed px-4 py-2.5 font-semibold text-app-muted opacity-45"
              >
                {action.label}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function PaginationControls({
  currentPage,
  pageCount,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-lg border border-app-border bg-app-card px-4 py-3 text-sm sm:flex-row">
      <p className="font-semibold text-app-muted">
        Page {currentPage} sur {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-app-muted disabled:opacity-45"
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-app-muted disabled:opacity-45"
        >
          Suivant
        </button>
      </div>
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

function EmptyState({
  canCreate,
  pharmacyId,
}: {
  canCreate: boolean;
  pharmacyId: string;
}) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Aucun produit</p>
      <h2 className="mt-2 text-2xl font-bold text-app-text">Aucun produit enregistré</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
        Cette pharmacie n’a pas encore de produits visibles dans son catalogue.
      </p>
      <div className="mt-5">
        <AddProductButton canCreate={canCreate} pharmacyId={pharmacyId} />
      </div>
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

function cleanFilters(filters: ProductFilters): ProductFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => typeof value === "string" && value.trim()),
  ) as ProductFilters;
}
