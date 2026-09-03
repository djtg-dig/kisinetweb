"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import JsBarcode from "jsbarcode";

type PrintReceiptData = {
  invoice: {
    reference: string;
    customerName: string;
    customerPhone: string;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    changeAmount: number;
    createdAt: string;
    items: Array<{
      productName: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }>;
  };
  pharmacy: {
    name: string;
    phone?: string;
    address?: string;
  };
  currency: string;
  receiptPaperWidth: 58 | 80;
  paymentInfo?: {
    reference: string;
    amount: string;
    amountReceived: string;
    changeAmount: string;
    paymentMethod: string;
    paidAt: string;
    cashierEmail?: string;
  };
};

type PrintableInvoiceReceiptProps = {
  data: PrintReceiptData | null;
  onPrintComplete: () => void;
};

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number, currencyCode: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function BarcodeForPrint({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      });
    } catch {
      // silent fail
    }
  }, [value]);

  return (
    <svg
      ref={svgRef}
      style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
    />
  );
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
  BANK_TRANSFER: "Virement bancaire",
  OTHER: "Autre",
};

function TicketContent({ data }: { data: PrintReceiptData }) {
  const is58mm = data.receiptPaperWidth === 58;
  const currencyCode = data.currency || "USD";
  // Le reste a payer vient de la facture metier rechargee apres succes backend.
  const remainingAmount = Math.max(data.invoice.remainingAmount, 0);

  const paperClass = is58mm ? "ticket-58mm" : "ticket-80mm";

  const ticketStyle: CSSProperties = is58mm
    ? {
        width: "54mm",
        padding: "2mm 1mm",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "9px",
        lineHeight: "1.2",
        background: "#fff",
        color: "#000",
        boxSizing: "border-box",
      }
    : {
        width: "76mm",
        padding: "3mm 2mm",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineHeight: "1.3",
        background: "#fff",
        color: "#000",
        boxSizing: "border-box",
      };

  const dividerStyle: CSSProperties = {
    borderTop: "1px dashed #000",
    margin: is58mm ? "1.5mm 0" : "2mm 0",
  };

  const labelStyle: CSSProperties = {
    fontSize: is58mm ? "8px" : "9px",
    color: "#555",
    marginBottom: is58mm ? "1mm" : "1.5mm",
  };

  const rowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: is58mm ? "1.5mm" : "2mm",
    gap: "2mm",
  };

  const productNameStyle: CSSProperties = {
    flex: "1",
    wordBreak: "break-word",
    minWidth: 0,
  };

  const productQtyStyle: CSSProperties = {
    fontSize: is58mm ? "8px" : "9px",
    color: "#333",
    whiteSpace: "nowrap",
  };

  const productTotalStyle: CSSProperties = {
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textAlign: "right",
  };

  const totalRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: is58mm ? "1mm" : "1.5mm",
  };

  const grandTotalStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    fontSize: is58mm ? "11px" : "12px",
  };

  return (
    <div className={`${paperClass}`} style={ticketStyle}>
      <div style={{ textAlign: "center", marginBottom: is58mm ? "2mm" : "3mm" }}>
        <div style={{ fontWeight: "bold", fontSize: is58mm ? "12px" : "14px" }}>
          {data.pharmacy.name}
        </div>
        <div style={{ fontWeight: "bold", marginTop: is58mm ? "2mm" : "2.5mm", fontSize: is58mm ? "11px" : "13px" }}>
          FACTURE
        </div>
      </div>

      <div style={dividerStyle} />

      <div style={{ marginBottom: is58mm ? "2mm" : "2.5mm" }}>
        <div style={rowStyle}>
          <span>Réf :</span>
          <span style={{ fontWeight: "bold", textAlign: "right" }}>{data.invoice.reference}</span>
        </div>
        {data.paymentInfo?.paidAt && (
          <div style={rowStyle}>
            <span>Date :</span>
            <span>{formatDateTime(data.paymentInfo.paidAt)}</span>
          </div>
        )}
        {data.paymentInfo?.cashierEmail && (
          <div style={rowStyle}>
            <span>Caissier :</span>
            <span>{data.paymentInfo.cashierEmail.split("@")[0]}</span>
          </div>
        )}
        {data.paymentInfo?.paymentMethod && (
          <div style={rowStyle}>
            <span>Paiement :</span>
            <span>{PAYMENT_METHOD_LABELS[data.paymentInfo.paymentMethod] || data.paymentInfo.paymentMethod}</span>
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      <div style={labelStyle}>PRODUITS</div>

      <div>
        {data.invoice.items.map((item, index) => (
          <div key={index} style={{ marginBottom: is58mm ? "2mm" : "2.5mm" }}>
            <div style={productNameStyle}>{item.productName}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5mm" }}>
              <span style={productQtyStyle}>
                {item.quantity} x {formatMoney(item.unitPrice, currencyCode)}
              </span>
              <span style={productTotalStyle}>{formatMoney(item.totalPrice, currencyCode)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={dividerStyle} />

      <div>
        <div style={totalRowStyle}>
          <span>Sous-total</span>
          <span>{formatMoney(data.invoice.subtotalAmount, currencyCode)}</span>
        </div>
        {data.invoice.discountAmount > 0 && (
          <div style={totalRowStyle}>
            <span>Remise</span>
            <span>-{formatMoney(data.invoice.discountAmount, currencyCode)}</span>
          </div>
        )}
        <div style={grandTotalStyle}>
          <span>TOTAL</span>
          <span>{formatMoney(data.invoice.totalAmount, currencyCode)}</span>
        </div>
        {data.paymentInfo && (
          <>
            <div style={totalRowStyle}>
              <span>Payé</span>
              <span>{formatMoney(Number(data.paymentInfo.amountReceived), currencyCode)}</span>
            </div>
            <div style={totalRowStyle}>
              <span>Reste à payer</span>
              <span>{formatMoney(remainingAmount, currencyCode)}</span>
            </div>
            {data.invoice.changeAmount > 0 && (
              <div style={totalRowStyle}>
                <span>Monnaie</span>
                <span>{formatMoney(data.invoice.changeAmount, currencyCode)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={dividerStyle} />

      <div style={{ textAlign: "center", marginBottom: is58mm ? "2mm" : "2.5mm" }}>
        <BarcodeForPrint value={data.invoice.reference} />
        <div style={{
          fontSize: is58mm ? "9px" : "10px",
          fontFamily: "monospace",
          marginTop: "1mm",
          letterSpacing: "0.3mm",
        }}>
          {data.invoice.reference}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: is58mm ? "8px" : "9px" }}>
        Merci de votre visite.
      </div>
    </div>
  );
}

export function PrintableInvoiceReceipt({ data, onPrintComplete }: PrintableInvoiceReceiptProps) {
  const hasPrinted = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Le portail utilise document.body uniquement apres le montage cote navigateur.
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!data || hasPrinted.current) {
      return;
    }

    hasPrinted.current = true;

    // Deux frames garantissent que le ticket cache est monte avant l'ouverture de l'aperçu.
    let firstFrame = 0;
    let secondFrame = 0;
    const handleAfterPrint = () => {
      hasPrinted.current = false;
      onPrintComplete();
    };

    window.addEventListener("afterprint", handleAfterPrint, { once: true });

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.print();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [data, onPrintComplete]);

  if (!data || !isMounted) {
    return null;
  }

  return createPortal(
    <div id="invoice-print-root" aria-hidden="true">
      <TicketContent data={data} />
    </div>,
    document.body,
  );
}

export type { PrintReceiptData };
