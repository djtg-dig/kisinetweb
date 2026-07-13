"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getPharmacyDetail,
  getPharmacyPermissions,
  type PharmacyPermissions,
} from "@/lib/api";
import {
  getPendingPharmacyInvoices,
  type PendingInvoice,
} from "@/lib/api/invoices";

type InvoicesPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "ready" | "empty" | "forbidden" | "error";

export default function PharmacyInvoicesPage({ params }: InvoicesPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
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

    async function loadInvoicesPage() {
      setState("loading");
      setErrorMessage("");

      try {
        // On charge d'abord le contexte et les droits pour éviter d'appeler les factures sans accès vente.
        const [userPermissions, pharmacy] = await Promise.all([
          getPharmacyPermissions(pharmacyId),
          getPharmacyDetail(pharmacyId),
        ]);

        setPermissions(userPermissions);
        setPharmacyName(pharmacy.name || "");
        setCurrency(pharmacy.devise || "USD");

        if (!userPermissions.sale_view) {
          setState("forbidden");
          return;
        }

        const pendingInvoices = await getPendingPharmacyInvoices(pharmacyId);
        setInvoices(pendingInvoices);
        setState(pendingInvoices.length ? "ready" : "empty");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les factures.");
        setState("error");
      }
    }

    loadInvoicesPage();
  }, [pharmacyId]);

  const totalAmount = useMemo(
    () => invoices.reduce((total, invoice) => total + invoice.amount, 0),
    [invoices],
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-background text-app-text lg:min-h-[calc(100vh-4.5rem)]">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">
              {pharmacyName || "Pharmacie active"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Factures</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Consultez les factures en attente avant leur traitement par la caisse.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement des factures" className="min-h-[220px]" />
          </section>
        )}

        {state === "forbidden" && <ForbiddenState pharmacyId={pharmacyId} />}
        {state === "error" && <ErrorState message={errorMessage} pharmacyId={pharmacyId} />}
        {state === "empty" && <EmptyState pharmacyId={pharmacyId} />}
        {state === "ready" && (
          <InvoicesList
            invoices={invoices}
            currency={currency}
            totalAmount={totalAmount}
            pharmacyId={pharmacyId}
            canView={Boolean(permissions.sale_view)}
          />
        )}
      </main>
    </div>
  );
}

function InvoicesList({
  invoices,
  currency,
  totalAmount,
  pharmacyId,
  canView,
}: {
  invoices: PendingInvoice[];
  currency: string;
  totalAmount: number;
  pharmacyId: string;
  canView: boolean;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-app-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-700">Factures en attente</p>
          <h2 className="mt-1 text-xl font-bold text-app-text">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} à traiter
          </h2>
        </div>
        <div className="grid gap-1 text-sm lg:text-right">
          <span className="font-semibold text-app-muted">Montant total</span>
          <span className="text-lg font-bold text-app-text">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-app-border text-xs font-semibold text-app-muted">
              <th className="py-3 pr-4">Référence</th>
              <th className="py-3 pr-4">Client</th>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4 text-right">Montant</th>
              <th className="py-3 text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id || invoice.reference} className="border-b border-app-border last:border-0">
                <td className="py-3 pr-4 font-semibold text-app-text">{invoice.reference}</td>
                <td className="py-3 pr-4 text-app-muted">{invoice.customer}</td>
                <td className="py-3 pr-4 text-app-muted">{formatDateTime(invoice.createdAt)}</td>
                <td className="py-3 pr-4 text-right font-bold text-app-text">
                  {formatCurrency(invoice.amount, currency)}
                </td>
                <td className="py-3 text-right">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                    En attente
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={"/app/pharmacies/" + pharmacyId + "/sales/create"}>
          Nouvelle vente
        </LinkButton>
        <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary">
          Retour au dashboard
        </LinkButton>
      </div>

      {!canView && (
        <p className="mt-4 text-sm font-semibold text-red-600">
          Votre accès aux factures est limité par les permissions de vente.
        </p>
      )}
    </section>
  );
}

function EmptyState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Aucune facture</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Rien à traiter pour le moment</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Les factures créées et non traitées par la caisse apparaîtront ici.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={"/app/pharmacies/" + pharmacyId + "/sales/create"}>
          Nouvelle vente
        </LinkButton>
        <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary">
          Retour au dashboard
        </LinkButton>
      </div>
    </section>
  );
}

function ForbiddenState({ pharmacyId }: { pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Accès limité</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Factures indisponibles</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Vous n'avez pas la permission de consulter les ventes et les factures de cette pharmacie.
      </p>
      <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary" className="mt-5">
        Retour au dashboard
      </LinkButton>
    </section>
  );
}

function ErrorState({ message, pharmacyId }: { message: string; pharmacyId: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Erreur de chargement</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Factures indisponibles</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary" className="mt-5">
        Retour au dashboard
      </LinkButton>
    </section>
  );
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Date non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
