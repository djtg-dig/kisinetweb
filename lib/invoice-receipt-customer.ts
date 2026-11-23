export type ReceiptCustomerInfo = {
  name: string;
  phone: string | null;
};

export function getReceiptCustomerInfo(
  customerName: string | null | undefined,
  customerPhone: string | null | undefined,
): ReceiptCustomerInfo | null {
  const name = customerName?.trim();
  if (!name) {
    return null;
  }

  const phone = customerPhone?.trim();
  return { name, phone: phone || null };
}
