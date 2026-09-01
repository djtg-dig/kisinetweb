"use client";

// Page dédiée à la lecture des produits d'une facture de vente.
import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getPharmacyDetail } from "@/lib/api";
import {
  getInvoiceDetail,
  type InvoiceDetail,
  type InvoiceProductLine,
} from "@/lib/api/invoices";

type InvoiceProductsPageProps = {
  params: Promise<{ pharmacyId: string; invoiceReference: string }>;
};

type PageState = "loading" | "ready" | "error";

export default function InvoiceProductsPage({ params }: InvoiceProductsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    // Les paramètres App Router sont résolus côté client avant tout appel API.
    async function readParams() {
      const resolvedParams = await params;

      if (!isCurrent) {
        return;
      }

      setPharmacyId(resolvedParams.pharmacyId);
      setInvoiceReference(resolvedParams.invoiceReference);
    }

    readParams();

    return () => {
      isCurrent = false;
    };
  }, [params]);

  useEffect(() => {
    if (!pharmacyId || !invoiceReference) {
      return;
    }

    let isCurrent = true;

    // La page relit le détail de facture car la liste ne transporte pas les produits.
    async function loadInvoiceProducts() {
      setState("loading");
      setErrorMessage("");

      try {
        const [invoiceDetail, pharmacy] = await Promise.all([
          getInvoiceDetail(pharmacyId, invoiceReference),
          getPharmacyDetail(pharmacyId).catch(() => null),
        ]);

        if (!isCurrent) {
          return;
        }

        setInvoice(invoiceDetail);
        setCurrency(pharmacy?.devise || "USD");
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les produits de cette facture.",
        );
        setState("error");
      }
    }

    loadInvoiceProducts();

    return () => {
      isCurrent = false;
    };
  }, [pharmacyId, invoiceReference]);

  const invoicesPath = "/app/pharmacies/" + encodeURIComponent(pharmacyId) + "/invoices";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="grid gap-5 border-b border-app-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary-700">Facture {invoiceReference}</p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">Produits de la facture</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
            Lignes vendues, calculs par produit et totaux de la facture.
          </p>
        </div>
        <LinkButton href={invoicesPath} variant="secondary" className="self-start">
          Retour aux factures
        </LinkButton>
      </header>

      <section className="py-8">
        {state === "loading" && <LoadingBubble label="Chargement des produits" />}

        {state === "error" && (
          <ErrorState message={errorMessage} invoicesPath={invoicesPath} />
        )}

        {state === "ready" && invoice && (
          <InvoiceProductsView invoice={invoice} currency={currency} />
        )}
      </section>
    </main>
  );
}

function InvoiceProductsView({
  invoice,
  currency,
}: {
  invoice: InvoiceDetail;
  currency: string;
}) {
  const totals = useMemo(() => buildInvoiceProductTotals(invoice), [invoice]);

  return (
    <div className="grid gap-6">
      <SummaryCards invoice={invoice} totals={totals} currency={currency} />
      <ProductsTable items={invoice.items} currency={currency} />
      <TotalsPanel invoice={invoice} totals={totals} currency={currency} />
    </div>
  );
}

function SummaryCards({
  invoice,
  totals,
  currency,
}: {
  invoice: InvoiceDetail;
  totals: InvoiceProductTotals;
  currency: string;
}) {
  // Ces cartes résument rapidement la facture avant la lecture détaillée des lignes.
  const cards = [
    { label: "Produits", value: String(totals.itemsCount) },
    { label: "Quantité totale", value: String(totals.totalQuantity) },
    { label: "Sous-total lignes", value: formatCurrency(totals.linesTotal, currency) },
    { label: "Total général", value: formatCurrency(invoice.totalAmount, currency) },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{card.label}</p>
          <p className="mt-3 text-2xl font-bold text-app-text">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function ProductsTable({
  items,
  currency,
}: {
  items: InvoiceProductLine[];
  currency: string;
}) {
  if (!items.length) {
    return (
      <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-app-muted">
          Aucun produit n'est associé à cette facture.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-card shadow-sm">
      <div className="border-b border-app-border px-5 py-4">
        <h2 className="text-lg font-bold text-app-text">Lignes de produits</h2>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-app-border bg-app-surface text-xs font-semibold uppercase text-app-muted">
              <th className="px-5 py-3">Produit</th>
              <th className="px-5 py-3">Référence</th>
              <th className="px-5 py-3 text-right">Prix unitaire</th>
              <th className="px-5 py-3 text-right">Quantité</th>
              <th className="px-5 py-3 text-right">Total ligne</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.product + item.productName} className="border-b border-app-border last:border-0">
                <td className="px-5 py-4 font-semibold text-app-text">{item.productName}</td>
                <td className="px-5 py-4 text-app-muted">{item.product}</td>
                <td className="px-5 py-4 text-right text-app-muted">
                  {formatCurrency(item.unitPrice, currency)}
                </td>
                <td className="px-5 py-4 text-right text-app-muted">{item.quantity}</td>
                <td className="px-5 py-4 text-right font-bold text-app-text">
                  {formatCurrency(item.totalPrice, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {items.map((item) => (
          <article key={item.product + item.productName} className="rounded-lg border border-app-border bg-app-surface p-4">
            <div>
              <h3 className="font-bold text-app-text">{item.productName}</h3>
              <p className="mt-1 text-sm text-app-muted">{item.product}</p>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <Info label="Prix unitaire" value={formatCurrency(item.unitPrice, currency)} />
              <Info label="Quantité" value={String(item.quantity)} />
              <Info label="Total ligne" value={formatCurrency(item.totalPrice, currency)} strong />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TotalsPanel({
  invoice,
  totals,
  currency,
}: {
  invoice: InvoiceDetail;
  totals: InvoiceProductTotals;
  currency: string;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-app-text">Calculs de la facture</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Sous-total lignes" value={formatCurrency(totals.linesTotal, currency)} />
        <Detail label="Sous-total facture" value={formatCurrency(invoice.subtotalAmount, currency)} />
        <Detail label="Réduction" value={formatCurrency(invoice.discountAmount, currency)} />
        <Detail label="Total général" value={formatCurrency(invoice.totalAmount, currency)} />
        <Detail label="Montant payé" value={formatCurrency(invoice.paidAmount, currency)} />
        <Detail label="Reste à payer" value={formatCurrency(invoice.remainingAmount, currency)} />
      </dl>
    </section>
  );
}

function ErrorState({
  message,
  invoicesPath,
}: {
  message: string;
  invoicesPath: string;
}) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Erreur</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Produits indisponibles</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton href={invoicesPath} variant="secondary" className="mt-5">
        Retour aux factures
      </LinkButton>
    </section>
  );
}

function Info({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className={strong ? "mt-1 font-bold text-app-text" : "mt-1 font-medium text-app-text"}>
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-4">
      <dt className="text-xs font-semibold uppercase text-app-muted">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-app-text">{value}</dd>
    </div>
  );
}

type InvoiceProductTotals = {
  itemsCount: number;
  totalQuantity: number;
  linesTotal: number;
};

function buildInvoiceProductTotals(invoice: InvoiceDetail): InvoiceProductTotals {
  // Les totaux affichés reflètent les lignes visibles sur la page.
  return {
    itemsCount: invoice.items.length,
    totalQuantity: invoice.items.reduce((total, item) => total + item.quantity, 0),
    linesTotal: invoice.items.reduce((total, item) => total + item.totalPrice, 0),
  };
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(value);
}
