import type { PharmacySummary } from "@/lib/api";

const PLAN_RANK: Record<string, number> = {
  BASIC: 1,
  STANDARD: 2,
  ENTERPRISE: 3,
};

export function isPaidSubscriptionActive(pharmacy: PharmacySummary) {
  if (
    pharmacy.subscriptionStatus !== "ACTIVE" ||
    pharmacy.subscriptionIsTrialActive ||
    !pharmacy.subscriptionExpiresAt
  ) {
    return false;
  }

  const expiry = new Date(pharmacy.subscriptionExpiresAt);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() > Date.now();
}

export function getSubscriptionPurchaseError(
  pharmacy: PharmacySummary | null,
  requestedPlan?: string,
) {
  if (!pharmacy || !requestedPlan || !isPaidSubscriptionActive(pharmacy)) {
    return "";
  }

  const currentPlan = (pharmacy.planName || "").toUpperCase();
  const currentRank = PLAN_RANK[currentPlan] || 0;
  const requestedRank = PLAN_RANK[requestedPlan.toUpperCase()] || 0;
  if (!currentRank || !requestedRank) {
    return "";
  }
  if (requestedRank === currentRank) {
    return "Votre pharmacie bénéficie déjà de ce forfait jusqu'à son expiration.";
  }
  if (requestedRank < currentRank) {
    return "Un forfait inférieur ne peut pas être acheté tant que l'abonnement actuel est valide.";
  }
  return "";
}
