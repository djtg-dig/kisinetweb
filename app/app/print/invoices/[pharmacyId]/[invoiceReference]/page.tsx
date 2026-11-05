"use client";

import { useEffect, useState } from "react";
import { InvoiceReceiptTicket, type PrintReceiptData } from "@/components/invoices/PrintableInvoiceReceipt";
import "@/components/invoices/invoice-receipt.css";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  getPharmacyDetail,
  getPharmacyGeneralSettings,
  getPharmacyPermissions,
} from "@/lib/api";
import { getInvoiceDetail } from "@/lib/api/invoices";

type PrintInvoicePageProps = {
  params: Promise<{ pharmacyId: string; invoiceReference: string }>;
};

type PageState = "loading" | "ready" | "forbidden" | "unprintable" | "error";

export default function PrintInvoicePage({ params }: PrintInvoicePageProps) {
  const [state, setState] = useState<PageState>("loading");
  const [receipt, setReceipt] = useState<PrintReceiptData | null>(null);
  const [invoicesPath, setInvoicesPath] = useState("/app/pharmacies");

  useEffect(() => {
    let isCurrent = true;

    async function loadReceipt() {
      try {
        const { pharmacyId, invoiceReference } = await params;
        const listPath = "/app/pharmacies/" + encodeURIComponent(pharmacyId) + "/invoices";

        if (!isCurrent) return;
        setInvoicesPath(listPath);

        const permissions = await getPharmacyPermissions(pharmacyId);

        if (!isCurrent) return;

        if (!permissions.sale_view) {
          setState("forbidden");
          return;
        }

        const [invoice, pharmacy, settings] = await Promise.all([
          getInvoiceDetail(pharmacyId, invoiceReference),
          getPharmacyDetail(pharmacyId),
          // La lecture des réglages n'est pas indispensable pour consulter ou imprimer le ticket.
          getPharmacyGeneralSettings(pharmacyId).catch(() => null),
        ]);

        if (!isCurrent) return;

        if (invoice.paymentStatus !== "PAID" && invoice.paymentStatus !== "OVERPAID") {
          setState("unprintable");
          return;
        }

        setReceipt({
          invoice,
          pharmacy: { name: pharmacy.name || "Pharmacie" },
          currency: pharmacy.devise || "USD",
          receiptPaperWidth: settings?.receiptPaperWidth || 80,
        });
        setState("ready");
      } catch {
        if (isCurrent) setState("error");
      }
    }

    loadReceipt();
    return () => {
      isCurrent = false;
    };
  }, [params]);

  if (state === "loading") {
    return <main className="min-h-screen bg-app-background p-6 text-app-text">Chargement du ticket…</main>;
  }

  if (state !== "ready" || !receipt) {
    const message = state === "forbidden"
      ? "Vous n'avez pas l'autorisation de consulter cette facture."
      : state === "unprintable"
        ? "Seules les factures payées peuvent être imprimées."
        : "Le ticket ne peut pas être chargé pour le moment.";

    return (
      <main className="min-h-screen bg-app-background p-6 text-app-text">
        <section className="mx-auto max-w-md rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <h1 className="text-xl font-bold">Ticket indisponible</h1>
          <p className="mt-3 text-sm leading-6 text-app-muted">{message}</p>
          <LinkButton href={invoicesPath} variant="secondary" className="mt-6">Retour aux factures</LinkButton>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 text-black sm:p-6">
      <header className="no-print mx-auto mb-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Aperçu du ticket</h1>
          <p className="mt-1 text-sm text-slate-600">Vérifiez le contenu avant de l'imprimer.</p>
        </div>
        <div className="flex gap-3">
          <LinkButton href={invoicesPath} variant="secondary">Retour</LinkButton>
          <Button type="button" onClick={() => window.print()}>Imprimer ce ticket</Button>
        </div>
      </header>

      <section aria-label="Ticket de facture">
        <InvoiceReceiptTicket data={receipt} />
      </section>
    </main>
  );
}
