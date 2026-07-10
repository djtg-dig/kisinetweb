"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  clearSaleDraft,
  createSale,
  getCurrentCashierName,
  getSavedSaleDraft,
  saveSaleDraft,
  searchSaleProducts,
  type CreateSalePayload,
  type DiscountType,
  type PaymentMethod,
  type SaleDraftItem,
  type SaleDraftStorage,
  type SaleProduct,
} from "@/lib/api/sales";
import { getPharmacyDashboard } from "@/lib/dashboard-api";

type CreateSalePageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "ready" | "error";
type SaleMode = "manual" | "ai";

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  reference: string;
};

type PrescriptionForm = {
  mode: "none" | "image";
  prescriberName: string;
  reference: string;
  prescribedAt: string;
};

type DiscountForm = {
  type: DiscountType;
  value: string;
  reason: string;
};

const defaultCustomer: CustomerForm = {
  name: "",
  phone: "",
  address: "",
  reference: "",
};

const defaultPrescription: PrescriptionForm = {
  mode: "none",
  prescriberName: "",
  reference: "",
  prescribedAt: "",
};

const defaultDiscount: DiscountForm = {
  type: "none",
  value: "",
  reason: "",
};

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Carte" },
  { value: "other", label: "Autre" },
];

export default function CreateSalePage({ params }: CreateSalePageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [cashierName, setCashierName] = useState("Non renseigné");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState("");
  const [mode, setMode] = useState<SaleMode>("manual");
  const [items, setItems] = useState<SaleDraftItem[]>([]);
  const [customer, setCustomer] = useState<CustomerForm>(defaultCustomer);
  const [prescription, setPrescription] = useState<PrescriptionForm>(defaultPrescription);
  const [discount, setDiscount] = useState<DiscountForm>(defaultDiscount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

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

    async function loadPageContext() {
      setPageState("loading");
      setPageError("");

      try {
        const [dashboard, cashier] = await Promise.all([
          getPharmacyDashboard(pharmacyId),
          getCurrentCashierName(),
        ]);
        const savedDraft = getSavedSaleDraft(pharmacyId);
        setPharmacyName(dashboard.pharmacy.name);
        setCashierName(cashier);
        if (savedDraft) {
          restoreDraft(savedDraft);
          setFeedback({ tone: "info", message: "Un brouillon local a été restauré." });
        }
        setPageState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setPageError(message || "Impossible de préparer la page de vente.");
        setPageState("error");
      }
    }

    loadPageContext();
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
  const received = Math.max(Number(receivedAmount || 0), 0);
  const changeDue = Math.max(received - total, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const dashboardHref = "/app/pharmacies/" + pharmacyId + "/dashboard";
  const salesHref = "/app/pharmacies/" + pharmacyId + "/sales";
  const currency = "USD";

  function restoreDraft(draft: SaleDraftStorage) {
    setItems(draft.items || []);
    setCustomer({
      name: draft.customerName || "",
      phone: draft.customerPhone || "",
      address: draft.customerAddress || "",
      reference: draft.customerReference || "",
    });
    setPrescription({
      mode: draft.prescriptionMode || "none",
      prescriberName: draft.prescriberName || "",
      reference: draft.prescriptionReference || "",
      prescribedAt: draft.prescriptionDate || "",
    });
    setDiscount({
      type: draft.discountType || "none",
      value: draft.discountValue || "",
      reason: draft.discountReason || "",
    });
    setPaymentMethod(draft.paymentMethod || "cash");
    setReceivedAmount(draft.receivedAmount || "");
  }

  function buildDraft(): SaleDraftStorage {
    return {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerReference: customer.reference,
      prescriptionMode: prescription.mode,
      prescriberName: prescription.prescriberName,
      prescriptionReference: prescription.reference,
      prescriptionDate: prescription.prescribedAt,
      discountType: discount.type,
      discountValue: discount.value,
      discountReason: discount.reason,
      paymentMethod,
      receivedAmount,
      items,
    };
  }

  function addProduct(product: SaleProduct) {
    setFeedback(null);
    if (product.availableStock <= 0) {
      setFeedback({ tone: "error", message: "Stock insuffisant pour ce produit." });
      return;
    }

    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.product.reference === product.reference);
      if (!existing) {
        return [...currentItems, { product, quantity: 1 }];
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

  function saveDraft() {
    if (!pharmacyId) {
      return;
    }

    saveSaleDraft(pharmacyId, buildDraft());
    setFeedback({ tone: "success", message: "Brouillon enregistré localement." });
  }

  function cancelDraft() {
    if (!items.length && !customer.name && !receivedAmount) {
      return;
    }

    if (!window.confirm("Vider le brouillon de vente ?")) {
      return;
    }

    setItems([]);
    setCustomer(defaultCustomer);
    setPrescription(defaultPrescription);
    setDiscount(defaultDiscount);
    setPaymentMethod("cash");
    setReceivedAmount("");
    clearSaleDraft(pharmacyId);
    setFeedback({ tone: "info", message: "Brouillon vidé." });
  }

  async function submitSale() {
    if (!items.length) {
      setFeedback({ tone: "error", message: "Ajoutez au moins un produit à la vente." });
      return;
    }

    if (received < total) {
      setFeedback({
        tone: "error",
        message: "Le montant reçu est inférieur au total à encaisser.",
      });
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
        address: customer.address,
        reference: customer.reference,
      }),
      prescription:
        prescription.mode === "none"
          ? undefined
          : cleanObject({
              prescriberName: prescription.prescriberName,
              reference: prescription.reference,
              prescribedAt: prescription.prescribedAt,
            }),
      discount: {
        type: discount.type,
        value: Number(discount.value || 0),
        reason: discount.reason || undefined,
      },
      payment: {
        method: paymentMethod,
        receivedAmount: received,
      },
    };

    try {
      await createSale(payload);
      clearSaleDraft(pharmacyId);
      setFeedback({ tone: "success", message: "Vente validée avec succès." });
    } catch (error) {
      setFeedback({
        tone: "info",
        message:
          error instanceof Error
            ? error.message
            : "La validation backend de la vente sera ajoutée ultérieurement.",
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
          <SaleModeSelector mode={mode} onChange={setMode} />
          {mode === "manual" ? (
            <ProductSearch pharmacyId={pharmacyId} onAdd={addProduct} currency={currency} />
          ) : (
            <AiScannerPlaceholder />
          )}
          <SaleDraft
            items={items}
            currency={currency}
            onQuantityChange={updateQuantity}
            onRemove={removeItem}
          />
          <CustomerSection customer={customer} onChange={setCustomer} />
          <PrescriptionSection prescription={prescription} onChange={setPrescription} />
          <DiscountSection
            discount={discount}
            subtotal={subtotal}
            currency={currency}
            onChange={updateDiscount}
          />
          <PaymentSection
            method={paymentMethod}
            receivedAmount={receivedAmount}
            onMethodChange={setPaymentMethod}
            onReceivedAmountChange={setReceivedAmount}
          />
        </div>

        <SaleSummary
          itemCount={items.length}
          totalItems={totalItems}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          total={total}
          received={received}
          changeDue={changeDue}
          currency={currency}
          cashierName={cashierName}
          submitting={submitting}
          onSaveDraft={saveDraft}
          onCancel={cancelDraft}
          onSubmit={submitSale}
        />
      </div>
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
          Ajoutez les produits, vérifiez le stock et finalisez la vente.
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

function SaleModeSelector({
  mode,
  onChange,
}: {
  mode: SaleMode;
  onChange: (mode: SaleMode) => void;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <ModeCard
        active={mode === "manual"}
        title="Entrée manuelle"
        description="Recherchez et ajoutez les produits disponibles dans la pharmacie."
        buttonLabel="Commencer la saisie manuelle"
        onClick={() => onChange("manual")}
      />
      <ModeCard
        active={mode === "ai"}
        title="Scanner avec l'IA"
        description="Importez ou prenez une photo d'une ordonnance pour détecter les produits."
        buttonLabel="Préparer un scan"
        onClick={() => onChange("ai")}
      >
        <p className="mt-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
          Les résultats proposés par l'IA doivent être vérifiés avant validation.
        </p>
      </ModeCard>
    </section>
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
  const [state, setState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [error, setError] = useState("");

  async function searchProducts() {
    if (!query.trim()) {
      setResults([]);
      setState("idle");
      return;
    }

    setState("loading");
    setError("");

    try {
      const rows = await searchSaleProducts(pharmacyId, query);
      setResults(rows);
      setState(rows.length ? "ready" : "empty");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Recherche indisponible.");
      setState("error");
    }
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-app-text">Recherche produit</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchProducts();
              }
            }}
            placeholder="Nom, référence ou code-barres saisi"
            className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
          />
        </label>
        <button
          type="button"
          onClick={searchProducts}
          className="self-end rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200"
        >
          Rechercher
        </button>
      </div>

      <div className="mt-5">
        {state === "idle" && (
          <p className="text-sm text-app-muted">Recherchez par nom, référence ou code-barres.</p>
        )}
        {state === "loading" && <LoadingBubble label="Recherche des produits" className="min-h-[120px]" />}
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
          <Info label="Expiration" value={formatDate(product.expirationDate)} />
          <Info label="Stock" value={String(product.availableStock)} />
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

function AiScannerPlaceholder() {
  return (
    <section className="rounded-lg border border-dashed border-cyan-200 bg-cyan-50 p-6">
      <h2 className="text-lg font-bold text-app-text">Scanner avec l'IA</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        L'import d'image d'ordonnance sera connecté plus tard. Pour le moment, cette zone prépare
        seulement l'expérience de scan sans lancer d'analyse automatique.
      </p>
      <label className="mt-5 flex min-h-[180px] cursor-not-allowed items-center justify-center rounded-lg border border-cyan-200 bg-white px-4 text-center text-sm font-semibold text-cyan-700">
        Import d'image indisponible pour le moment
        <input type="file" accept="image/*" className="hidden" disabled />
      </label>
    </section>
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
        <TextInput label="Adresse" value={customer.address} onChange={(address) => onChange({ ...customer, address })} />
        <TextInput
          label="Référence client"
          value={customer.reference}
          onChange={(reference) => onChange({ ...customer, reference })}
        />
      </div>
    </FormSection>
  );
}

function PrescriptionSection({
  prescription,
  onChange,
}: {
  prescription: PrescriptionForm;
  onChange: (prescription: PrescriptionForm) => void;
}) {
  return (
    <FormSection title="Ordonnance associée" description="Section facultative.">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          label="Ordonnance"
          value={prescription.mode}
          options={[
            { value: "none", label: "Aucune ordonnance" },
            { value: "image", label: "Importer une image" },
          ]}
          onChange={(mode) => onChange({ ...prescription, mode: mode as "none" | "image" })}
        />
        <TextInput
          label="Nom du prescripteur"
          value={prescription.prescriberName}
          onChange={(prescriberName) => onChange({ ...prescription, prescriberName })}
        />
        <TextInput
          label="Référence de l'ordonnance"
          value={prescription.reference}
          onChange={(reference) => onChange({ ...prescription, reference })}
        />
        <TextInput
          label="Date de prescription"
          type="date"
          value={prescription.prescribedAt}
          onChange={(prescribedAt) => onChange({ ...prescription, prescribedAt })}
        />
      </div>
      {prescription.mode === "image" && (
        <label className="mt-4 flex min-h-[110px] cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-app-border bg-app-surface px-4 text-center text-sm font-semibold text-app-muted">
          Import visuel uniquement pour le moment
          <input type="file" accept="image/*" className="hidden" disabled />
        </label>
      )}
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

function PaymentSection({
  method,
  receivedAmount,
  onMethodChange,
  onReceivedAmountChange,
}: {
  method: PaymentMethod;
  receivedAmount: string;
  onMethodChange: (method: PaymentMethod) => void;
  onReceivedAmountChange: (amount: string) => void;
}) {
  return (
    <FormSection title="Moyen de paiement" description="Aucune logique de paiement externe n'est encore déclenchée.">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          label="Paiement"
          value={method}
          options={paymentOptions}
          onChange={(value) => onMethodChange(value as PaymentMethod)}
        />
        <TextInput
          label="Montant reçu"
          type="number"
          value={receivedAmount}
          onChange={onReceivedAmountChange}
        />
      </div>
      <p className="mt-3 text-xs text-app-muted">
        M-Pesa, Airtel Money, Orange Money et Afrimoney pourront être ajoutés plus tard.
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
  received,
  changeDue,
  currency,
  cashierName,
  submitting,
  onSaveDraft,
  onCancel,
  onSubmit,
}: {
  itemCount: number;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  received: number;
  changeDue: number;
  currency: string;
  cashierName: string;
  submitting: boolean;
  onSaveDraft: () => void;
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
        <SummaryRow label="Montant reçu" value={formatCurrency(received, currency)} />
        <SummaryRow label="Monnaie à rendre" value={formatCurrency(changeDue, currency)} />
        <SummaryRow label="Devise" value={currency} />
        <SummaryRow label="Caissier" value={cashierName} />
      </div>
      {received > 0 && received < total && (
        <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-700">
          Le montant reçu est inférieur au total.
        </p>
      )}
      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-success-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Validation..." : "Valider et encaisser"}
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50"
        >
          Enregistrer le brouillon
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
  const toneClass =
    tone === "success"
      ? "border-success-200 bg-success-50 text-success-700"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-cyan-200 bg-cyan-50 text-cyan-700";

  return (
    <div className={`mt-6 flex items-start justify-between gap-4 rounded-lg border p-4 ${toneClass}`}>
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
