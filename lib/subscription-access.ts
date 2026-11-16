import { ApiError } from "@/lib/api/errors";
import type { PharmacyPermissions } from "@/lib/api";

export const SUBSCRIPTION_INACTIVE_CODE = "SUBSCRIPTION_INACTIVE";

type SubscriptionSummary = {
  is_active?: unknown;
};

function getSubscriptionSummary(value: unknown): SubscriptionSummary | null {
  return value && typeof value === "object" ? (value as SubscriptionSummary) : null;
}

/**
 * Le détail de la pharmacie expose déjà l'état effectif de son abonnement.
 * Cette information complète le 403 historique du backend, qui ne comporte
 * pas encore de code métier pour ce cas précis.
 */
export function isKnownInactiveSubscription(subscription: unknown): boolean {
  return getSubscriptionSummary(subscription)?.is_active === false;
}

/**
 * Un refus d'accès n'est jamais assimilé à un abonnement expiré par défaut.
 * Le code métier est prioritaire ; le repli historique ne s'applique que
 * lorsqu'un 403 accompagne un état d'abonnement explicitement inactif.
 */
export function isSubscriptionInactiveError(
  error: unknown,
  subscription: unknown,
): boolean {
  if (error instanceof ApiError && error.code === SUBSCRIPTION_INACTIVE_CODE) {
    return true;
  }

  return (
    error instanceof ApiError &&
    error.status === 403 &&
    isKnownInactiveSubscription(subscription)
  );
}

/** Les propriétaires reçoivent aussi cette permission depuis le backend. */
export function canPayPharmacySubscription(permissions: PharmacyPermissions): boolean {
  return Boolean(permissions.subscription_pay);
}

export const SUBSCRIPTION_PURCHASE_DENIED_MESSAGE =
  "Vous n'êtes pas autorisé à souscrire ou renouveler l'abonnement de cette pharmacie. Veuillez contacter son propriétaire ou un responsable habilité.";

export const MEMBER_LIMIT_REACHED_MESSAGE =
  "La limite d'utilisateurs de votre forfait a été atteinte. Passez à un forfait supérieur pour inviter d'autres collaborateurs.";

export const MEMBER_INVITATION_PERMISSION_MESSAGE =
  "Vous ne disposez pas des permissions nécessaires pour inviter un collaborateur dans cette pharmacie.";

/**
 * Garde les erreurs de validation métier du backend et ne normalise que les
 * deux cas dont le libellé est une règle UX explicite.
 */
export function getMemberInvitationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (/limite d['’]utilisateurs.*forfait.*atteinte/i.test(message)) {
    return MEMBER_LIMIT_REACHED_MESSAGE;
  }

  if (error instanceof ApiError && error.status === 403) {
    return MEMBER_INVITATION_PERMISSION_MESSAGE;
  }

  if (error instanceof ApiError && error.status && error.status < 500 && message) {
    return message;
  }

  return "Impossible d'envoyer cette invitation. Réessayez dans quelques instants.";
}
