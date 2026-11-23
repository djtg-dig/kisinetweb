import type { PharmacyPermissions } from "@/lib/api";

export const INVOICE_COLLECTION_QUERY_PARAM = "collect";

export function canAccessInvoiceCollection(permissions: PharmacyPermissions): boolean {
  return Boolean(permissions.sale_view && permissions.sale_payment_create);
}

export function buildInvoiceCollectionPath(
  pharmacyId: string,
  invoiceReference: string,
): string {
  const query = new URLSearchParams({ [INVOICE_COLLECTION_QUERY_PARAM]: invoiceReference });
  return "/app/pharmacies/" + encodeURIComponent(pharmacyId) + "/invoices?" + query.toString();
}
