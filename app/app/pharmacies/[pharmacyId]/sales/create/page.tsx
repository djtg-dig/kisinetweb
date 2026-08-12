"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  analyzePrescription,
  clearSaleDraft,
  createSale,
  getCurrentCashierName,
  getSavedSaleDraft,
  saveSaleDraft,
  searchSaleProducts,
  uploadPrescriptionCapture,
  type CreateSalePayload,
  type DetectedMedication,
  type DiscountType,
  type SaleDraftItem,
  type SaleDraftStorage,
  type SaleProduct,
} from "@/lib/api/sales";
import { describeApiError } from "@/lib/api/errors";
import { getAccountProfile } from "@/lib/api";
import { getUserAiCredits } from "@/lib/api/billing";
import { notifyAiCreditsUpdated } from "@/lib/ai-credits-events";
import { getPharmacyDashboard } from "@/lib/dashboard-api";

type CreateSalePageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "ready" | "error";

type CustomerForm = {
  name: string;
  phone: string;
};

type DiscountForm = {
  type: DiscountType;
  value: string;
  reason: string;
};

const defaultCustomer: CustomerForm = {
  name: "",
  phone: "",
};

const defaultDiscount: DiscountForm = {
  type: "none",
  value: "",
  reason: "",
};

export default function CreateSalePage({ params }: CreateSalePageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [currency, setCurrency] = useState("");
  const [cashierName, setCashierName] = useState("Non renseigné");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState("");
  const [items, setItems] = useState<SaleDraftItem[]>([]);
  const [customer, setCustomer] = useState<CustomerForm>(defaultCustomer);
  const [discount, setDiscount] = useState<DiscountForm>(defaultDiscount);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [aiCreditsRemaining, setAiCreditsRemaining] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const aiUserReferenceRef = useRef("");

  useEffect(() => {
    let isCurrent = true;

    async function readParams() {
      const resolvedParams = await params;
      if (isCurrent) {
        setPharmacyId(resolvedParams.pharmacyId);
      }
    }

    readParams();

    return () => {
      isCurrent = false;
    };
  }, [params]);

  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    let isCurrent = true;

    async function loadPageContext() {
      setPageState("loading");
      setPageError("");

      try {
        const profile = await getAccountProfile();
        const userReference = profile.reference || "";
        aiUserReferenceRef.current = userReference;
        const [dashboard, cashier, aiCredits] = await Promise.all([
          getPharmacyDashboard(pharmacyId),
          getCurrentCashierName(),
          userReference
            ? getUserAiCredits(pharmacyId, userReference).catch(() => null)
            : Promise.resolve(null),
        ]);
        const savedDraft = getSavedSaleDraft(pharmacyId);
        if (!isCurrent) {
          return;
        }
        setPharmacyName(dashboard.pharmacy.name);
        setCurrency(dashboard.pharmacy.devise || "");
        setCashierName(cashier);
        setAiCreditsRemaining(aiCredits ? aiCredits.remaining : null);
        if (savedDraft) {
          restoreDraft(savedDraft);
          setFeedback({ tone: "info", message: "Un brouillon local a été restauré." });
        }
        setPageState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        const message = error instanceof Error ? error.message : "";
        setPageError(message || "Impossible de préparer la page de vente.");
        setPageState("error");
      }
    }

    loadPageContext();

    return () => {
      isCurrent = false;
    };
  }, [pharmacyId]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.product.salePrice * item.quantity, 0),
    [items],
  );
  const discountAmount = useMemo(
    () => calculateDiscountAmount(subtotal, discount.type, Number(discount.value || 0)),
    [subtotal, discount],
  );
  const taxAmount = 0;
  const total = Math.max(subtotal - discountAmount + taxAmount, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const dashboardHref = "/app/pharmacies/" + pharmacyId + "/dashboard";
  const salesHref = "/app/pharmacies/" + pharmacyId + "/sales";
  const activeCurrency = currency;
  const hasDraftContent =
    items.length > 0 ||
    customer.name.trim() !== "" ||
    customer.phone.trim() !== "" ||
    discount.type !== defaultDiscount.type ||
    discount.value.trim() !== "" ||
    discount.reason.trim() !== "";

  useEffect(() => {
    if (!pharmacyId || pageState !== "ready") {
      return;
    }

    if (items.length > 0) {
      saveSaleDraft(pharmacyId, {
        customerName: customer.name,
        customerPhone: customer.phone,
        discountType: discount.type,
        discountValue: discount.value,
        discountReason: discount.reason,
        items,
      });
      return;
    }

    clearSaleDraft(pharmacyId);
  }, [customer, discount, items, pageState, pharmacyId]);

  function restoreDraft(draft: SaleDraftStorage) {
    setItems(draft.items || []);
    setCustomer({
      name: draft.customerName || "",
      phone: draft.customerPhone || "",
    });
    setDiscount({
      type: draft.discountType || "none",
      value: draft.discountValue || "",
      reason: draft.discountReason || "",
    });
  }

  function addProduct(product: SaleProduct, quantity = 1) {
    setFeedback(null);
    if (product.availableStock <= 0) {
      setFeedback({ tone: "error", message: "Stock insuffisant pour ce produit." });
      return;
    }

    const requestedQuantity = Math.max(1, Math.min(Math.floor(quantity) || 1, product.availableStock));

    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.product.reference === product.reference);
      if (!existing) {
        return [...currentItems, { product, quantity: requestedQuantity }];
      }

      if (existing.quantity + 1 > existing.product.availableStock) {
        setFeedback({
          tone: "error",
          message: "La quantité demandée dépasse le stock disponible.",
        });
        return currentItems;
      }

      return currentItems.map((item) =>
        item.product.reference === product.reference
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }

  async function handleScanComplete(medications: DetectedMedication[]) {
    const candidates = medications.filter((med) => med.rawName.trim());
    if (!candidates.length) {
      setFeedback({
        tone: "info",
        message: "Aucun produit n'a été détecté sur l'ordonnance.",
      });
      return;
    }

    let addedCount = 0;
    const unmatched: string[] = [];

    for (const med of candidates) {
      try {
        const matches = await searchSaleProducts(pharmacyId, med.rawName.trim());
        const product = matches[0];
        if (!product) {
          unmatched.push(med.rawName);
          continue;
        }

        addProduct(product, parsePrescribedQuantity(med.prescribedQuantity));
        addedCount += 1;
      } catch {
        unmatched.push(med.rawName);
      }
    }

    if (addedCount > 0) {
      setFeedback({
        tone: "success",
        message:
          addedCount +
          " produit(s) ajouté(s) au brouillon depuis l'ordonnance." +
          (unmatched.length ? " " + unmatched.length + " introuvable(s) dans le stock." : ""),
      });
    } else {
      setFeedback({
        tone: "info",
        message: "Aucun produit détecté n'a pu être associé au stock de la pharmacie.",
      });
    }
  }

  function parsePrescribedQuantity(value: string | null): number {
    if (!value) {
      return 1;
    }

    const digits = value.match(/\d+/);
    return digits ? Number(digits[0]) : 1;
  }

  function updateQuantity(reference: string, quantity: number) {
    setFeedback(null);
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.product.reference !== reference) {
          return item;
        }

        if (quantity > item.product.availableStock) {
          setFeedback({
            tone: "error",
            message: "La quantité demandée dépasse le stock disponible.",
          });
        }

        return {
          ...item,
          quantity: Math.max(1, Math.min(quantity || 1, item.product.availableStock)),
        };
      }),
    );
  }

  function removeItem(reference: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.product.reference !== reference),
    );
  }

  function updateDiscount(nextDiscount: DiscountForm) {
    const value = Math.max(Number(nextDiscount.value || 0), 0);
    const maxValue = nextDiscount.type === "percent" ? 100 : subtotal;
    setDiscount({
      ...nextDiscount,
      value: nextDiscount.type === "none" ? "" : String(Math.min(value, maxValue)),
    });
  }

  function cancelDraft() {
    if (!hasDraftContent) {
      setFeedback({ tone: "info", message: "Aucun brouillon à vider." });
      return;
    }

    setCancelDialogOpen(true);
  }

  function confirmCancelDraft() {
    setItems([]);
    setCustomer(defaultCustomer);
    setDiscount(defaultDiscount);
    clearSaleDraft(pharmacyId);
    setCancelDialogOpen(false);
    setFeedback({ tone: "info", message: "Brouillon vidé." });
  }

  async function submitSale() {
    if (!items.length) {
      setFeedback({ tone: "error", message: "Ajoutez au moins un produit à la vente." });
      return;
    }

    setSubmitting(true);
    const payload: CreateSalePayload = {
      pharmacyReference: pharmacyId,
      items: items.map((item) => ({
        productReference: item.product.reference,
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
      })),
      customer: cleanObject({
        name: customer.name,
        phone: customer.phone,
      }),
      discount: {
        type: discount.type,
        value: Number(discount.value || 0),
        reason: discount.reason || undefined,
      },
    };

    try {
      await createSale(payload);
      setItems([]);
      setCustomer(defaultCustomer);
      setDiscount(defaultDiscount);
      clearSaleDraft(pharmacyId);
      setFeedback({ tone: "success", message: "Facture créée avec succès. Le paiement sera enregistré par le caissier." });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: describeApiError(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (pageState === "loading") {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
        <PageHeader
          pharmacyId={pharmacyId}
          pharmacyName={pharmacyName}
          dashboardHref={dashboardHref}
          salesHref={salesHref}
        />
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
          <LoadingBubble label="Préparation de la vente" />
        </section>
      </main>
    );
  }

  if (pageState === "error") {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
        <PageHeader
          pharmacyId={pharmacyId}
          pharmacyName={pharmacyName}
          dashboardHref={dashboardHref}
          salesHref={salesHref}
        />
        <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">Impossible de charger la vente</p>
          <p className="mt-2 text-sm text-red-700">{pageError}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      <PageHeader
        pharmacyId={pharmacyId}
        pharmacyName={pharmacyName}
        dashboardHref={dashboardHref}
        salesHref={salesHref}
      />

      {feedback && (
        <ToastMessage tone={feedback.tone} onClose={() => setFeedback(null)}>
          {feedback.message}
        </ToastMessage>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2">
            <ProductSearch pharmacyId={pharmacyId} onAdd={addProduct} currency={activeCurrency} />
            <ModeCard
              active={scannerOpen}
              title="Scanner avec l'IA"
              description="Importez ou prenez une photo d'une ordonnance pour détecter les produits."
              buttonLabel="Scanner maintenant"
              onClick={() => setScannerOpen(true)}
            >
              {aiCreditsRemaining !== null && (
                <p className="mt-3 text-xs font-semibold text-primary-700">
                  ({aiCreditsRemaining.toLocaleString("fr-FR")} crédits IA restants)
                </p>
              )}
              <p className="mt-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                Les résultats proposés par l'IA doivent être vérifiés avant validation.
              </p>
            </ModeCard>
          </section>
          <AiScannerModal
            open={scannerOpen}
            pharmacyId={pharmacyId}
            userReferenceRef={aiUserReferenceRef}
            onCreditsUpdated={(remaining) => setAiCreditsRemaining(remaining)}
            onClose={() => setScannerOpen(false)}
            onComplete={handleScanComplete}
          />
          <SaleDraft
            items={items}
            currency={activeCurrency}
            onQuantityChange={updateQuantity}
            onRemove={removeItem}
          />
          <CustomerSection customer={customer} onChange={setCustomer} />
          <DiscountSection
            discount={discount}
            subtotal={subtotal}
            currency={activeCurrency}
            onChange={updateDiscount}
          />
        </div>

        <SaleSummary
          itemCount={items.length}
          totalItems={totalItems}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          total={total}
          currency={activeCurrency}
          cashierName={cashierName}
          submitting={submitting}
          onCancel={cancelDraft}
          onSubmit={submitSale}
        />
      </div>

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Vider le brouillon"
        message="Voulez-vous vraiment annuler cette vente ? Les produits et les informations saisies dans ce brouillon seront supprimés."
        confirmLabel="Vider le brouillon"
        cancelLabel="Continuer la vente"
        onConfirm={confirmCancelDraft}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </main>
  );
}

function PageHeader({
  pharmacyName,
  dashboardHref,
  salesHref,
}: {
  pharmacyId: string;
  pharmacyName: string;
  dashboardHref: string;
  salesHref: string;
}) {
  return (
    <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="text-sm font-semibold text-primary-700">
          {pharmacyName || "Pharmacie active"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">Nouvelle vente</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
          Ajoutez les produits, vérifiez le stock et créez la facture. Le paiement sera enregistré séparément par le caissier.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href={dashboardHref} variant="secondary">
          Retour au dashboard
        </LinkButton>
        <LinkButton href={salesHref} variant="secondary">
          Historique des ventes
        </LinkButton>
      </div>
    </header>
  );
}

function ModeCard({
  active,
  title,
  description,
  buttonLabel,
  children,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  buttonLabel: string;
  children?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <article
      className={`rounded-lg border bg-app-card p-5 shadow-sm ${
        active ? "border-primary-200 ring-2 ring-primary-100" : "border-app-border"
      }`}
    >
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{description}</p>
      {children}
      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200"
      >
        {buttonLabel}
      </button>
    </article>
  );
}

function ProductSearch({
  pharmacyId,
  currency,
  onAdd,
}: {
  pharmacyId: string;
  currency: string;
  onAdd: (product: SaleProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SaleProduct[]>([]);
  const [state, setState] = useState<"idle" | "short" | "loading" | "ready" | "empty" | "error">("idle");
  const [error, setError] = useState("");
  const latestSearchRef = useRef(0);

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
        const rows = await searchSaleProducts(pharmacyId, searchTerm);
        if (latestSearchRef.current !== searchId) {
          return;
        }

        setResults(rows);
        setState(rows.length ? "ready" : "empty");
      } catch (searchError) {
        if (latestSearchRef.current !== searchId) {
          return;
        }

        setResults([]);
        setError(searchError instanceof Error ? searchError.message : "Recherche indisponible.");
        setState("error");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pharmacyId, query]);

  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-app-text">Entrée manuelle</h2>
        <p className="mt-1 text-sm leading-6 text-app-muted">
          Recherchez et ajoutez les produits disponibles dans la pharmacie.
        </p>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-app-text">Recherche produit</span>
          <div className="relative">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, référence ou code-barres saisi"
              className="min-h-11 w-full rounded-md border border-app-border bg-white px-3 pr-12 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
            />
            {state === "loading" && (
              <span
                aria-label="Recherche en cours"
                role="status"
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600"
              />
            )}
          </div>
        </label>
      </div>

      <div className="mt-5">
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
          <div className="grid gap-3">
            {results.map((product) => (
              <ProductResultCard
                key={product.reference}
                product={product}
                currency={currency}
                onAdd={() => onAdd(product)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductResultCard({
  product,
  currency,
  onAdd,
}: {
  product: SaleProduct;
  currency: string;
  onAdd: () => void;
}) {
  const stockIsLow = product.availableStock <= 0;

  return (
    <article className="grid gap-4 rounded-lg border border-app-border bg-app-surface p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-app-text">{product.name}</h3>
          {product.isExpired && <Badge tone="error">Expiré</Badge>}
          {product.isExpiringSoon && <Badge tone="warning">Expire bientôt</Badge>}
        </div>
        <p className="mt-1 text-xs font-semibold text-app-muted">Référence {product.reference}</p>
        <div className="mt-3 grid gap-2 text-sm text-app-muted sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Forme" value={product.form || "Non renseignée"} />
          <Info label="Dosage" value={product.dosage || "Non renseigné"} />
          <Info label="Stock" value={String(product.availableStock)} />
          <Info label="État" value={getStockStatus(product)} />
        </div>
      </div>
      <div className="flex flex-col gap-3 md:items-end">
        <p className="text-lg font-bold text-app-text">
          {formatCurrency(product.salePrice, currency)}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={stockIsLow || product.isExpired}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-success-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-success-700 disabled:cursor-not-allowed disabled:bg-app-border disabled:text-app-muted"
        >
          Ajouter
        </button>
      </div>
    </article>
  );
}

function AiScannerModal({
  open,
  pharmacyId,
  userReferenceRef,
  onCreditsUpdated,
  onClose,
  onComplete,
}: {
  open: boolean;
  pharmacyId: string;
  userReferenceRef: React.RefObject<string>;
  onCreditsUpdated?: (remaining: number) => void;
  onClose: () => void;
  onComplete: (medications: DetectedMedication[]) => void;
}) {
  const [stage, setStage] = useState<"camera" | "review" | "analyzing">("camera");
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [previewBox, setPreviewBox] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (open) {
      setStage("camera");
      setPreview(null);
      setCameraError("");
      setError("");
      setSeconds(0);
      startCamera();
    } else {
      stopCamera();
      analysisAbortRef.current?.abort();
      analysisAbortRef.current = null;
    }

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (stage !== "analyzing") {
      return;
    }

    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    const image = previewImgRef.current;
    if (!image) {
      return;
    }

    const update = () =>
      setPreviewBox({ width: image.clientWidth, height: image.clientHeight });
    update();

    const observer = new ResizeObserver(update);
    observer.observe(image);
    return () => observer.disconnect();
  }, [stage, preview]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("La caméra n'est pas disponible sur cet appareil.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError(
        "Impossible d'accéder à la caméra. Utilisez le stockage local pour importer une photo.",
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    setPreview(canvas.toDataURL("image/jpeg"));
    setCropRect({ x: 0, y: 0, w: 1, h: 1 });
    setCroppedPreviewUrl(null);
    setStage("review");
  }

  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setCropRect({ x: 0, y: 0, w: 1, h: 1 });
      setCroppedPreviewUrl(null);
      setStage("review");
    };
    reader.readAsDataURL(file);
  }

  function dataUrlToBlob(dataUrl: string): File {
    const base64 = dataUrl.split(",")[1] ?? "";
    const byteString = atob(base64);
    const bytes = new Uint8Array(byteString.length);
    for (let index = 0; index < byteString.length; index += 1) {
      bytes[index] = byteString.charCodeAt(index);
    }

  return new File([bytes], "prescription.jpg", { type: "image/jpeg" });
}

type CropRect = { x: number; y: number; w: number; h: number };

function cropImage(
  dataUrl: string,
  rect: CropRect,
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sx = Math.round(rect.x * image.naturalWidth);
      const sy = Math.round(rect.y * image.naturalHeight);
      const sw = Math.max(1, Math.round(rect.w * image.naturalWidth));
      const sh = Math.max(1, Math.round(rect.h * image.naturalHeight));

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Impossible de rogner l'image."));
        return;
      }

      context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              file: new File([blob], "prescription-cropped.jpg", { type: "image/jpeg" }),
              dataUrl: croppedDataUrl,
            });
          } else {
            reject(new Error("Échec du rognage de l'image."));
          }
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => reject(new Error("Image illisible."));
    image.src = dataUrl;
  });
}

function CropOverlay({
  width,
  height,
  rect,
  onChange,
}: {
  width: number;
  height: number;
  rect: CropRect;
  onChange: (rect: CropRect) => void;
}) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: "draw" | "move" | "resize";
    corner?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);
  const lastRectRef = useRef<CropRect>(rect);
  const [localRect, setLocalRect] = useState<CropRect>(rect);

  useEffect(() => {
    if (!dragRef.current) {
      lastRectRef.current = rect;
      setLocalRect(rect);
    }
  }, [rect]);

  function toNorm(clientX: number, clientY: number) {
    const el = layerRef.current;
    if (!el) {
      return { x: 0, y: 0 };
    }
    const bounds = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height)),
    };
  }

  function computeNext(point: { x: number; y: number }, drag: NonNullable<typeof dragRef.current>): CropRect {
    if (drag.mode === "draw") {
      return {
        x: Math.min(drag.startX, point.x),
        y: Math.min(drag.startY, point.y),
        w: Math.max(Math.abs(point.x - drag.startX), 0.02),
        h: Math.max(Math.abs(point.y - drag.startY), 0.02),
      };
    }

    if (drag.mode === "move") {
      const nextX = Math.min(
        1 - drag.startRect.w,
        Math.max(0, drag.startRect.x + (point.x - drag.startX)),
      );
      const nextY = Math.min(
        1 - drag.startRect.h,
        Math.max(0, drag.startRect.y + (point.y - drag.startY)),
      );
      return { ...drag.startRect, x: nextX, y: nextY };
    }

    const corner = drag.corner as "nw" | "ne" | "sw" | "se";
    let nextX = drag.startRect.x;
    let nextY = drag.startRect.y;
    let nextW = drag.startRect.w;
    let nextH = drag.startRect.h;

    if (corner === "nw") {
      nextX = point.x;
      nextY = point.y;
      nextW = drag.startRect.x + drag.startRect.w - point.x;
      nextH = drag.startRect.y + drag.startRect.h - point.y;
    } else if (corner === "ne") {
      nextY = point.y;
      nextW = point.x - drag.startRect.x;
      nextH = drag.startRect.y + drag.startRect.h - point.y;
    } else if (corner === "sw") {
      nextX = point.x;
      nextW = drag.startRect.x + drag.startRect.w - point.x;
      nextH = point.y - drag.startRect.y;
    } else {
      nextW = point.x - drag.startRect.x;
      nextH = point.y - drag.startRect.y;
    }

    nextW = Math.max(0.02, nextW);
    nextH = Math.max(0.02, nextH);
    return {
      x: Math.max(0, Math.min(nextX, 1 - nextW)),
      y: Math.max(0, Math.min(nextY, 1 - nextH)),
      w: nextW,
      h: nextH,
    };
  }

  function beginDrag(
    event: React.PointerEvent,
    mode: "draw" | "move" | "resize",
    corner?: "nw" | "ne" | "sw" | "se",
  ) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    const point = toNorm(event.clientX, event.clientY);
    dragRef.current = {
      mode,
      corner,
      startX: point.x,
      startY: point.y,
      startRect: localRect,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const next = computeNext(toNorm(event.clientX, event.clientY), drag);
    lastRectRef.current = next;
    setLocalRect(next);
  }

  function endDrag() {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    onChange(lastRectRef.current);
  }

  const left = localRect.x * width;
  const top = localRect.y * height;
  const boxWidth = localRect.w * width;
  const boxHeight = localRect.h * height;
  const handle =
    "absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-600";

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 cursor-crosshair touch-none"
      onPointerDown={(event) => beginDrag(event, "draw")}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="absolute border-2 border-primary-600"
        style={{
          left,
          top,
          width: boxWidth,
          height: boxHeight,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          cursor: "move",
        }}
        onPointerDown={(event) => beginDrag(event, "move")}
      >
        <span className={`${handle} left-0 top-0`} onPointerDown={(event) => beginDrag(event, "resize", "nw")} />
        <span className={`${handle} left-full top-0`} onPointerDown={(event) => beginDrag(event, "resize", "ne")} />
        <span className={`${handle} left-0 top-full`} onPointerDown={(event) => beginDrag(event, "resize", "sw")} />
        <span className={`${handle} left-full top-full`} onPointerDown={(event) => beginDrag(event, "resize", "se")} />
      </div>
    </div>
  );
}

  async function refreshAiCredits() {
    const userReference = userReferenceRef.current;
    if (!userReference) {
      return;
    }
    const credits = await getUserAiCredits(pharmacyId, userReference).catch(() => null);
    if (credits) {
      onCreditsUpdated?.(credits.remaining);
      // Notifie les autres pages (ex. l'espace personnel) pour qu'elles
      // actualisent leur affichage des crédits IA.
      notifyAiCreditsUpdated();
    }
  }

  function cancelAnalysis() {
    analysisAbortRef.current?.abort();
    analysisAbortRef.current = null;
  }

  async function runAnalysis() {
    if (!preview) {
      return;
    }

    setStage("analyzing");
    setSeconds(0);
    setError("");

    const abortController = new AbortController();
    analysisAbortRef.current = abortController;

    const isFullImage =
      cropRect.x === 0 && cropRect.y === 0 && cropRect.w === 1 && cropRect.h === 1;
    let originalImage: File;
    if (isFullImage) {
      originalImage = dataUrlToBlob(preview);
    } else {
      const cropped = await cropImage(preview, cropRect);
      originalImage = cropped.file;
      setCroppedPreviewUrl(cropped.dataUrl);
    }

    // Sauvegarde de la capture en arrière-plan : indépendante de l'analyse
    // et non bloquante. Les échecs (ex. service de stockage indisponible)
    // sont ignorés car ils n'empêchent pas la création de la vente.
    void uploadPrescriptionCapture(pharmacyId, originalImage);

    try {
      const medications = await analyzePrescription(
        pharmacyId,
        originalImage,
        abortController.signal,
      );

      onComplete(medications);
      onClose();
    } catch (analysisError) {
      if (abortController.signal.aborted) {
        return;
      }
      setError(describeApiError(analysisError));
      setStage("review");
    } finally {
      refreshAiCredits();
    }
  }

  if (!open) {
    return null;
  }

  const analyzing = stage === "analyzing";

  function handleClose() {
    // Pendant l'analyse, on annule la requête en cours pour éviter
    // d'ajouter des produits après la fermeture.
    if (analyzing) {
      cancelAnalysis();
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto p-4 pt-20 sm:pt-24">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-scanner-title"
        className="relative my-auto flex max-h-[calc(100dvh-6rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-app-border bg-app-card shadow-soft"
      >
        <header className="flex items-center justify-between gap-4 border-b border-app-border px-5 py-4">
          <h2 id="ai-scanner-title" className="text-lg font-bold text-app-text">
            Scanner avec l'IA
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface"
            aria-label="Fermer"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {stage !== "camera" && (
          <p className="mx-5 mt-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
            Les résultats proposés par l'IA doivent être vérifiés avant validation.
          </p>
        )}

        <div className="min-h-0 overflow-y-auto p-5">
          {stage === "camera" && (
            <div className="relative overflow-hidden rounded-lg border border-app-border bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-[4/3] w-full bg-black object-cover"
              />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-semibold text-white">
                  {cameraError}
                </div>
              )}

              {/* Contrôle bas-gauche : ouvrir le stockage local pour importer une photo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 shadow transition hover:bg-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" />
                </svg>
                Stockage local
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={Boolean(cameraError)}
                className="absolute bottom-3 right-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-lg transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-app-border"
                aria-label="Capturer la photo"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a2 2 0 012-2h2l1.5-2h7L19 6h0a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilePicked}
              />
            </div>
          )}

          {stage === "review" && preview && (
            <div className="grid gap-4">
              <div className="relative mx-auto inline-block max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={previewImgRef}
                  src={preview}
                  alt="Ordonnance capturée"
                  className="block max-h-[70vh] w-auto max-w-full rounded-lg border border-app-border"
                />
                {previewBox.width > 0 && (
                  <CropOverlay
                    width={previewBox.width}
                    height={previewBox.height}
                    rect={cropRect}
                    onChange={setCropRect}
                  />
                )}
              </div>
              <p className="text-xs text-app-muted">
                Cadrez la zone de l'ordonnance à analyser, puis cliquez sur « Scanner ».
              </p>
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setError("");
                    setStage("camera");
                    startCamera();
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50"
                >
                  Reprendre
                </button>
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Scanner
                </button>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="grid gap-4">
              {(croppedPreviewUrl ?? preview) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(croppedPreviewUrl ?? preview) as string}
                  alt="Ordonnance analysée"
                  className="max-h-[70vh] w-full rounded-lg border border-app-border object-contain opacity-80"
                />
              )}
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <span
                  aria-label="Analyse en cours"
                  role="status"
                  className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600"
                />
                <p className="text-sm font-semibold text-primary-700">
                  Analyse en cours... {seconds}s
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-app-border px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}

function SaleDraft({
  items,
  currency,
  onQuantityChange,
  onRemove,
}: {
  items: SaleDraftItem[];
  currency: string;
  onQuantityChange: (reference: string, quantity: number) => void;
  onRemove: (reference: string) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-app-text">Brouillon de vente</h2>
      {!items.length ? (
        <p className="mt-4 rounded-md border border-app-border bg-app-surface p-4 text-sm text-app-muted">
          Le brouillon est vide. Ajoutez un produit pour commencer la vente.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-app-border text-xs font-semibold text-app-muted">
                <th className="py-3 pr-4">Produit</th>
                <th className="py-3 pr-4">Prix unitaire</th>
                <th className="py-3 pr-4">Quantité</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Sous-total</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.product.reference} className="border-b border-app-border last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-app-text">{item.product.name}</p>
                    <p className="text-xs text-app-muted">{item.product.reference}</p>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-app-text">
                    {formatCurrency(item.product.salePrice, currency)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex w-fit items-center rounded-md border border-app-border bg-white">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.product.reference, item.quantity - 1)}
                        className="h-10 w-10 text-lg font-bold text-app-muted hover:text-primary-700"
                      >
                        -
                      </button>
                      <input
                        value={String(item.quantity)}
                        onChange={(event) =>
                          onQuantityChange(item.product.reference, Number(event.target.value))
                        }
                        className="h-10 w-16 border-x border-app-border text-center text-sm font-semibold outline-none"
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.product.reference, item.quantity + 1)}
                        className="h-10 w-10 text-lg font-bold text-app-muted hover:text-primary-700"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-app-muted">{item.product.availableStock}</td>
                  <td className="py-3 pr-4 font-bold text-app-text">
                    {formatCurrency(item.product.salePrice * item.quantity, currency)}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => onRemove(item.product.reference)}
                      className="font-semibold text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CustomerSection({
  customer,
  onChange,
}: {
  customer: CustomerForm;
  onChange: (customer: CustomerForm) => void;
}) {
  return (
    <FormSection title="Informations client" description="Client anonyme par défaut.">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Nom du client" value={customer.name} onChange={(name) => onChange({ ...customer, name })} />
        <TextInput label="Téléphone" value={customer.phone} onChange={(phone) => onChange({ ...customer, phone })} />
      </div>
    </FormSection>
  );
}

function DiscountSection({
  discount,
  subtotal,
  currency,
  onChange,
}: {
  discount: DiscountForm;
  subtotal: number;
  currency: string;
  onChange: (discount: DiscountForm) => void;
}) {
  return (
    <FormSection title="Réduction" description="La réduction est contrôlée avant validation.">
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectInput
          label="Type"
          value={discount.type}
          options={[
            { value: "none", label: "Aucune réduction" },
            { value: "percent", label: "Pourcentage" },
            { value: "amount", label: "Montant" },
          ]}
          onChange={(type) => onChange({ ...discount, type: type as DiscountType })}
        />
        <TextInput
          label={discount.type === "percent" ? "Pourcentage" : "Montant"}
          type="number"
          value={discount.value}
          disabled={discount.type === "none"}
          onChange={(value) => onChange({ ...discount, value })}
        />
        <TextInput
          label="Motif"
          value={discount.reason}
          onChange={(reason) => onChange({ ...discount, reason })}
        />
      </div>
      <p className="mt-3 text-xs font-semibold text-app-muted">
        Sous-total disponible pour réduction : {formatCurrency(subtotal, currency)}
      </p>
    </FormSection>
  );
}

function SaleSummary({
  itemCount,
  totalItems,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  currency,
  cashierName,
  submitting,
  onCancel,
  onSubmit,
}: {
  itemCount: number;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  cashierName: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <aside className="sticky top-24 rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-app-text">Résumé de la vente</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <SummaryRow label="Produits différents" value={String(itemCount)} />
        <SummaryRow label="Articles" value={String(totalItems)} />
        <SummaryRow label="Sous-total" value={formatCurrency(subtotal, currency)} />
        <SummaryRow label="Réduction" value={"-" + formatCurrency(discountAmount, currency)} />
        <SummaryRow label="Taxe" value={formatCurrency(taxAmount, currency)} />
        <div className="border-t border-app-border pt-3">
          <SummaryRow label="Total" value={formatCurrency(total, currency)} strong />
        </div>
        <SummaryRow label="Devise" value={currency} />
        <SummaryRow label="Préparée par" value={cashierName} />
      </div>
      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-success-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Création..." : "Créer la facture"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Annuler
        </button>
      </div>
    </aside>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      <p className="mt-1 text-sm text-app-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  type = "text",
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-app-surface disabled:text-app-muted"
      />
    </label>
  );
}

function SelectInput({
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
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
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

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-bold text-app-text" : "text-app-muted"}>{label}</span>
      <span className={strong ? "text-lg font-bold text-app-text" : "font-semibold text-app-text"}>
        {value}
      </span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 font-medium text-app-text">{value}</p>
    </div>
  );
}

function Badge({ tone, children }: { tone: "warning" | "error"; children: React.ReactNode }) {
  return (
    <span
      className={
        tone === "error"
          ? "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100"
          : "rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100"
      }
    >
      {children}
    </span>
  );
}

function ToastMessage({
  tone,
  children,
  onClose,
}: {
  tone: "success" | "error" | "info";
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);

    return () => window.clearTimeout(timer);
  }, [children, onClose]);

  const toneClass =
    tone === "success"
      ? "border-success-200 bg-success-50 text-success-700"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-cyan-200 bg-cyan-50 text-cyan-700";

  return (
    <div
      role="status"
      className={`fixed right-4 top-20 z-[1200] flex w-[min(calc(100vw-2rem),28rem)] items-start justify-between gap-4 rounded-lg border p-4 shadow-soft lg:top-24 ${toneClass}`}
    >
      <p className="text-sm font-semibold">{children}</p>
      <button type="button" onClick={onClose} className="text-sm font-bold">
        Fermer
      </button>
    </div>
  );
}

function calculateDiscountAmount(subtotal: number, type: DiscountType, value: number) {
  if (type === "percent") {
    return Math.min(subtotal, subtotal * Math.min(Math.max(value, 0), 100) / 100);
  }

  if (type === "amount") {
    return Math.min(subtotal, Math.max(value, 0));
  }

  return 0;
}

function cleanObject<T extends Record<string, string | undefined>>(input: T) {
  const output = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value && value.trim()),
  ) as Partial<T>;

  return Object.keys(output).length ? output : undefined;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}

function getStockStatus(product: SaleProduct) {
  if (product.availableStock <= 0) {
    return "Indisponible";
  }

  if (product.isExpired) {
    return "Expiré";
  }

  if (product.isExpiringSoon) {
    return "Expire bientôt";
  }

  return "Disponible";
}
