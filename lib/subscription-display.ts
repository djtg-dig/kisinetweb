type SubscriptionRecord = Record<string, unknown>;

function asRecord(value: unknown): SubscriptionRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SubscriptionRecord)
    : null;
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isExpired(subscription: SubscriptionRecord, status: string | undefined) {
  if (status === "EXPIRED") {
    return true;
  }

  const expiresAt = asText(subscription.expires_at);
  return subscription.is_active === false && Boolean(expiresAt) && Date.parse(expiresAt as string) <= Date.now();
}

export function getSubscriptionDisplayLabel(subscriptionValue: unknown): string | undefined {
  const subscription = asRecord(subscriptionValue);
  if (!subscription) {
    return "Aucun abonnement actif";
  }

  const status = asText(subscription.status)?.toUpperCase();
  if (subscription.is_trial_active === true && subscription.is_active === true) {
    return "Forfait Essai";
  }

  if (subscription.is_active === true && status === "ACTIVE") {
    const planCode = asText(subscription.plan_code)?.toUpperCase();
    const planLabels: Record<string, string> = {
      BASIC: "Forfait Basic",
      STANDARD: "Forfait Standard",
      ENTERPRISE: "Forfait Entreprise",
    };

    return planCode ? planLabels[planCode] || "Aucun abonnement actif" : "Aucun abonnement actif";
  }

  if (isExpired(subscription, status)) {
    return "Abonnement expiré";
  }

  return "Aucun abonnement actif";
}
