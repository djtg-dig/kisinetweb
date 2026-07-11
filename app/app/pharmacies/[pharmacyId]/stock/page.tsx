"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getPharmacyPermissions,
  getPharmacyProducts,
  type PharmacyPermissions,
  type ProductSummary,
} from "@/lib/api";
import {
  createStockMovement,
  getStockMovementDetail,
  getStockMovements,
  type StockMovement,
  type StockMovementType,
} from "@/lib/api/stock-movements";

type StockPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "forbidden" | "empty" | "ready";

type MovementForm = {
  productReference: string;
  movementType: StockMovementType;
  quantity: string;
  newStock: string;
  reason: string;
};

const initialForm: MovementForm = {
  productReference: "",
  movementType: "IN",
  quantity: "1",
  newStock: "",
  reason: "",
};

const movementTypeOptions: { value: StockMovementType; label: string }[] = [
  { value: "IN", label: "Entrée" },
  { value: "OUT", label: "Sortie" },
  { value: "ADJUSTMENT", label: "Ajustement" },
];

export default function PharmacyStockPage({ params }: StockPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<MovementForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovements, setTotalMovements] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isPending, startTransition] = useTransition();

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

    async function loadStockPage() {
      // Au premier chargement uniquement, on affiche l'etat de chargement.
      // Lors d'un rafraichissement (creation, pagination), on conserve la
      // liste deja affichee afin d'eviter un saut d'affichage.
      const isFirstLoad = state === "loading";
      if (isFirstLoad) {
        setState("loading");
        setSuccessMessage("");
      }
      setErrorMessage("");

      try {
        const pharmacyPermissions = await getPharmacyPermissions(pharmacyId);
        setPermissions(pharmacyPermissions);

        if (!pharmacyPermissions.stock_view) {
          setState("forbidden");
          return;
        }

        const movementsPage = await getStockMovements({
            pharmacyReference: pharmacyId,
            ordering: "-created_at",
            page: String(currentPage),
          });

          setMovements(movementsPage.results);
          setTotalMovements(movementsPage.count);
        setHasNextPage(Boolean(movementsPage.next));
        setHasPreviousPage(Boolean(movementsPage.previous));
        setState(movementsPage.results.length ? "ready" : "empty");
      } catch (error) {
        if (isFirstLoad) {
          setErrorMessage(
            error instanceof Error ? error.message : "Impossible de charger le stock.",
          );
          setState("error");
        } else {
          setErrorMessage(
            error instanceof Error ? error.message : "Impossible de recharger le stock.",
          );
        }
      }
    }

    loadStockPage();
  }, [pharmacyId, currentPage, reloadKey]);

  const totalQuantity = useMemo(
    () => movements.reduce((total, movement) => total + Math.abs(movement.quantity), 0),
    [movements],
  );
  const pageCount = Math.max(1, Math.ceil(totalMovements / 10));

  function updateForm(name: keyof MovementForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!permissions.stock_adjust) {
      setErrorMessage("Vous n'avez pas la permission de créer un mouvement de stock.");
      return;
    }

    if (!form.productReference.trim()) {
      setErrorMessage("Sélectionnez ou renseignez un produit.");
      return;
    }

    const isAdjustment = form.movementType === "ADJUSTMENT";
    let quantity: number | undefined;
    let newStock: number | undefined;

    if (isAdjustment) {
      newStock = Number(form.newStock);
      if (!Number.isInteger(newStock) || newStock < 0) {
        setErrorMessage("Le stock final doit être un entier positif ou nul.");
        return;
      }
    } else {
      quantity = Number(form.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setErrorMessage("La quantité doit être supérieure à zéro.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createStockMovement({
        pharmacyReference: pharmacyId,
        productReference: form.productReference.trim(),
        movementType: form.movementType,
        quantity,
        newStock,
        reason: form.reason.trim(),
      });
      setForm(initialForm);
      setSuccessMessage("Mouvement de stock créé avec succès.");
      startTransition(() => {
        setCurrentPage(1);
        setReloadKey((key) => key + 1);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de créer le mouvement de stock.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openMovementDetail(movement: StockMovement) {
    setLoadingDetailId(movement.id);
    setErrorMessage("");

    try {
      const detail = await getStockMovementDetail(movement.id);
      setSelectedMovement(detail);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger ce mouvement.",
      );
    } finally {
      setLoadingDetailId("");
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary-700">Stock</p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">Mouvements de stock</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
            Consultez les entrées, sorties et ajustements manuels de votre pharmacie.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SummaryPill label="Mouvements" value={String(totalMovements)} />
          <SummaryPill label="Quantité page" value={String(totalQuantity)} />
        </div>
      </header>

      {errorMessage && (
        <Message tone="error" message={errorMessage} />
      )}
      {successMessage && (
        <Message tone="success" message={successMessage} />
      )}

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
          <LoadingBubble label="Chargement des mouvements de stock" className="min-h-[220px]" />
        </section>
      )}

      {state === "forbidden" && <ForbiddenState pharmacyId={pharmacyId} />}
      {state === "error" && <ErrorState pharmacyId={pharmacyId} />}

      {(state === "ready" || state === "empty") && (
        <section className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
          <StockMovementForm
            canCreate={Boolean(permissions.stock_adjust)}
            pharmacyId={pharmacyId}
            form={form}
            submitting={submitting}
            pending={isPending}
            onChange={updateForm}
            onSubmit={submitMovement}
          />

          <div className="grid gap-4">
            {state === "empty" ? (
              <EmptyState />
            ) : (
              <StockMovementsList
                movements={movements}
                loadingDetailId={loadingDetailId}
                onOpenDetail={openMovementDetail}
              />
            )}
            <PaginationControls
              currentPage={currentPage}
              pageCount={pageCount}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </section>
      )}

      {selectedMovement && (
        <MovementDetailDialog
          movement={selectedMovement}
          onClose={() => setSelectedMovement(null)}
        />
      )}
    </main>
  );
}

function StockMovementForm({
  canCreate,
  pharmacyId,
  form,
  submitting,
  pending,
  onChange,
  onSubmit,
}: {
  canCreate: boolean;
  pharmacyId: string;
  form: MovementForm;
  submitting: boolean;
  pending: boolean;
  onChange: (name: keyof MovementForm, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-app-text">Créer un mouvement manuel</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Ajustez le stock lorsqu'une entrée, une sortie ou une correction est faite hors vente.
      </p>

      {!canCreate && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-100 p-3 text-sm font-semibold text-slate-500">
          Vous pouvez consulter le stock, mais vous ne pouvez pas créer de mouvement.
        </div>
      )}

      <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
        <ProductSearchField
          pharmacyId={pharmacyId}
          value={form.productReference}
          disabled={!canCreate || submitting}
          onSelect={(reference) => onChange("productReference", reference)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-app-text">Type</span>
            <select
              value={form.movementType}
              disabled={!canCreate || submitting}
              onChange={(event) => onChange("movementType", event.target.value)}
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {movementTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {form.movementType === "ADJUSTMENT" ? (
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-app-text">Stock final</span>
              <input
                type="number"
                min="0"
                value={form.newStock}
                disabled={!canCreate || submitting}
                placeholder="Ex. 23"
                onChange={(event) => onChange("newStock", event.target.value)}
                className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          ) : (
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-app-text">Quantité</span>
              <input
                type="number"
                min="1"
                value={form.quantity}
                disabled={!canCreate || submitting}
                onChange={(event) => onChange("quantity", event.target.value)}
                className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          )}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-app-text">Motif</span>
          <textarea
            value={form.reason}
            disabled={!canCreate || submitting}
            rows={3}
            onChange={(event) => onChange("reason", event.target.value)}
            className="rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <Button type="submit" disabled={!canCreate || submitting || pending}>
          {submitting ? "Création..." : "Créer le mouvement"}
        </Button>
      </form>
    </section>
  );
}

type ProductSearchState = "idle" | "short" | "loading" | "ready" | "empty" | "error";

function ProductSearchField({
  pharmacyId,
  value,
  disabled,
  onSelect,
}: {
  pharmacyId: string;
  value: string;
  disabled: boolean;
  onSelect: (reference: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [state, setState] = useState<ProductSearchState>("idle");
  const [error, setError] = useState("");
  const latestSearchRef = useRef(0);

  // Si la référence est vidée ailleurs (réinitialisation du formulaire),
  // on oublie le nom du produit sélectionné.
  useEffect(() => {
    if (!value) {
      setSelectedName("");
    }
  }, [value]);

  useEffect(() => {
    const searchTerm = query.trim();
    latestSearchRef.current += 1;
    const searchId = latestSearchRef.current;

    if (!searchTerm) {
      setResults([]);
      setState("idle");
      return;
    }

    if (searchTerm.length < 2) {
      setResults([]);
      setState("short");
      return;
    }

    setState("loading");
    setError("");

    const timer = window.setTimeout(async () => {
      try {
        const page = await getPharmacyProducts(pharmacyId, {
          search: searchTerm,
          ordering: "name",
          page: "1",
        });

        if (latestSearchRef.current !== searchId) {
          return;
        }

        setResults(page.results);
        setState(page.results.length ? "ready" : "empty");
      } catch (searchError) {
        if (latestSearchRef.current !== searchId) {
          return;
        }

        setResults([]);
        setError(
          searchError instanceof Error ? searchError.message : "Recherche indisponible.",
        );
        setState("error");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pharmacyId, query]);

  function resetSelection() {
    onSelect("");
    setSelectedName("");
    setQuery("");
    setResults([]);
    setState("idle");
  }

  if (value) {
    return (
      <div className="grid gap-1 text-sm">
        <span className="font-semibold text-app-text">Produit sélectionné</span>
        <div className="flex items-center justify-between gap-3 rounded-md border border-app-border bg-app-surface px-3 py-2">
          <span className="min-w-0 truncate text-sm font-semibold text-app-text">
            {selectedName || value}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={resetSelection}
            className="shrink-0 rounded-md border border-app-border bg-white px-3 py-1.5 text-xs font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Changer
          </button>
        </div>
        <p className="text-xs font-semibold text-app-muted">Référence {value}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">Produit</span>
      <div className="relative">
        <input
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nom, référence ou code-barres"
          className="min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 pr-12 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {state === "loading" && (
          <span
            aria-label="Recherche en cours"
            role="status"
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600"
          />
        )}
      </div>

      <div className="mt-2">
        {state === "idle" && (
          <p className="text-sm text-app-muted">Recherchez par nom, référence ou code-barres.</p>
        )}
        {state === "short" && (
          <p className="text-sm text-app-muted">Saisissez au moins 2 caractères.</p>
        )}
        {state === "loading" && (
          <p className="text-sm font-semibold text-primary-700">Recherche en cours...</p>
        )}
        {state === "error" && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {state === "empty" && <p className="text-sm text-app-muted">Aucun produit trouvé.</p>}
        {state === "ready" && (
          <ul className="grid max-h-64 gap-2 overflow-y-auto pr-1">
            {results.map((product) => (
              <li key={product.reference}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(product.reference);
                    setSelectedName(product.name);
                    setQuery("");
                    setResults([]);
                    setState("idle");
                  }}
                  className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-left transition hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="block truncate text-sm font-semibold text-app-text">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-app-muted">
                    Référence {product.reference} · Stock {product.currentStock}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StockMovementsList({
  movements,
  loadingDetailId,
  onOpenDetail,
}: {
  movements: StockMovement[];
  loadingDetailId: string;
  onOpenDetail: (movement: StockMovement) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card shadow-sm">
      <div className="hidden grid-cols-[1fr_0.7fr_0.6fr_0.8fr_0.8fr_auto] gap-4 rounded-t-lg border-b border-app-border bg-app-surface px-5 py-3 text-xs font-bold uppercase text-app-muted lg:grid">
        <span>Produit</span>
        <span>Type</span>
        <span className="text-right">Quantité</span>
        <span>Stock</span>
        <span>Date</span>
        <span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-app-border">
        {movements.map((movement) => (
          <article
            key={movement.id}
            className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_0.7fr_0.6fr_0.8fr_0.8fr_auto] lg:items-center"
          >
            <div className="min-w-0">
              <h2 className="truncate font-bold text-app-text">{movement.productName}</h2>
              <p className="mt-1 text-xs font-semibold text-app-muted">
                {movement.productReference || "Référence non renseignée"}
              </p>
            </div>
            <InfoCell label="Type" value={formatMovementType(movement.movementType)} />
            <InfoCell
              label="Quantité"
              value={String(movement.quantity)}
              alignRight
              tone={getMovementTone(movement.movementType)}
            />
            <InfoCell label="Stock" value={formatStockRange(movement)} />
            <InfoCell label="Date" value={formatDate(movement.createdAt)} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onOpenDetail(movement)}
                disabled={loadingDetailId === movement.id}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingDetailId === movement.id ? "Chargement..." : "Consulter"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MovementDetailDialog({
  movement,
  onClose,
}: {
  movement: StockMovement;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer le détail"
        onClick={onClose}
      />
      <section className="relative w-full max-w-lg rounded-lg border border-app-border bg-app-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary-700">Mouvement #{movement.id}</p>
            <h2 className="mt-2 text-xl font-bold text-app-text">{movement.productName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-sm font-semibold text-app-text hover:bg-primary-50"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Detail label="Type" value={formatMovementType(movement.movementType)} />
          <Detail label="Quantité" value={String(movement.quantity)} />
          <Detail label="Stock" value={formatStockRange(movement)} />
          <Detail label="Date" value={formatDate(movement.createdAt)} />
          <Detail label="Produit" value={movement.productReference} />
          <Detail label="Créé par" value={movement.createdBy} />
        </div>
        <div className="mt-4 rounded-lg border border-app-border bg-app-surface p-4">
          <p className="text-xs font-semibold text-app-muted">Motif</p>
          <p className="mt-1 text-sm leading-6 text-app-text">
            {movement.reason || "Aucun motif renseigné."}
          </p>
        </div>
      </section>
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
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-app-border bg-app-card p-4 text-sm sm:flex-row">
      <p className="font-semibold text-app-muted">
        Page {currentPage} sur {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function ForbiddenState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-slate-100 p-6 text-center">
      <h2 className="text-lg font-bold text-app-text">Accès au stock non autorisé</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-app-muted">
        Vous n'avez pas la permission de consulter les mouvements de stock de cette pharmacie.
      </p>
      <LinkButton
        href={"/app/pharmacies/" + pharmacyId + "/dashboard"}
        variant="secondary"
        className="mt-5"
      >
        Retour au tableau de bord
      </LinkButton>
    </section>
  );
}

function ErrorState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="text-lg font-bold text-red-700">Stock indisponible</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-red-700">
        Les mouvements de stock ne peuvent pas être chargés pour le moment.
      </p>
      <LinkButton
        href={"/app/pharmacies/" + pharmacyId + "/dashboard"}
        variant="secondary"
        className="mt-5"
      >
        Retour au tableau de bord
      </LinkButton>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-8 text-center shadow-sm">
      <h2 className="text-lg font-bold text-app-text">Aucun mouvement de stock</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Les entrées, sorties et ajustements créés apparaîtront ici.
      </p>
    </section>
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
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success-700"
      : tone === "warning"
        ? "text-orange-700"
        : "text-app-text";

  return (
    <div className={alignRight ? "lg:text-right" : ""}>
      <p className="text-xs font-semibold text-app-muted lg:hidden">{label}</p>
      <p className={`mt-1 text-sm font-semibold lg:mt-0 ${toneClass}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

function Message({ tone, message }: { tone: "success" | "error"; message: string }) {
  const className =
    tone === "success"
      ? "border-success-100 bg-success-50 text-success-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`mt-5 rounded-lg border p-4 text-sm font-semibold leading-6 ${className}`}>
      {message}
    </div>
  );
}

function formatMovementType(type: string) {
  const normalized = type.toUpperCase();
  if (normalized === "IN") return "Entrée";
  if (normalized === "OUT") return "Sortie";
  if (normalized === "ADJUSTMENT") return "Ajustement";
  return type || "Mouvement";
}

function getMovementTone(type: string): "default" | "success" | "warning" {
  const normalized = type.toUpperCase();
  if (normalized === "IN") return "success";
  if (normalized === "OUT") return "warning";
  return "default";
}

function formatStockRange(movement: StockMovement) {
  if (movement.previousStock === undefined && movement.newStock === undefined) {
    return "Non renseigné";
  }

  return `${movement.previousStock ?? "?"} -> ${movement.newStock ?? "?"}`;
}

function formatDate(value?: string) {
  if (!value) {
    return "Non renseignée";
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
