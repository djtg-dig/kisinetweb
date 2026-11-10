import type { PharmacySubscriptionPayment } from "@/lib/api";

export type SubscriptionReturnState =
  | "success"
  | "pending"
  | "cancelled"
  | "failed"
  | "unknown";

export function getSubscriptionReturnState(status: string): SubscriptionReturnState {
  switch (status.trim().toUpperCase()) {
    case "VALIDATED":
    case "PAID":
    case "SUCCEEDED":
      return "success";
    case "CANCELED":
    case "CANCELLED":
      return "cancelled";
    case "FAILED":
      return "failed";
    case "PENDING":
    case "PROCESSING":
    case "UNKNOWN":
    case "REFUNDED":
      return "pending";
    default:
      return "unknown";
  }
}

export function findPaymentByProviderReference(
  payments: PharmacySubscriptionPayment[],
  sessionId: string,
): PharmacySubscriptionPayment | undefined {
  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    return undefined;
  }

  return payments.find(
    (payment) => payment.providerReference?.trim() === normalizedSessionId,
  );
}
