// Classification des erreurs API pour l'affichage frontend.
//
// Règle centrale : le frontend se base sur le champ `code` renvoyé par le
// backend, et NON sur une recherche textuelle dans `detail`. Le texte `detail`
// est destiné à l'utilisateur final ; le `code` pilote la logique applicative.
//
// Contrats d'erreurs de l'analyse IA (voir docs/backend-api.md) :
//   - USER_CREDIT_EXHAUSTED (402)   -> crédits de la pharmacie réellement épuisés.
//   - AI_PROVIDER_ERROR (502)       -> indisponibilité fournisseur IA (quota,
//                                      RESOURCE_EXHAUSTED, timeout, réseau…).
//   - AI_SERVICE_UNAVAILABLE (503)  -> indisponibilité service d'analyse Kisinet.
//   - PRESCRIPTION_ANALYSIS_FAILED (422) -> erreur fonctionnelle de l'ordonnance.
//
// Les codes AI_PROVIDER_ERROR / AI_SERVICE_UNAVAILABLE ne doivent JAMAIS
// déclencher un message de crédits insuffisants : un quota fournisseur n'est
// pas un crédit utilisateur.

export class ApiError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export const CREDIT_EXHAUSTED_MESSAGE =
  "Crédits insuffisants : les crédits inclus et les crédits achetés de cette pharmacie sont épuisés.";

export const AI_UNAVAILABLE_MESSAGE =
  "Le service d'analyse IA est temporairement indisponible. Veuillez réessayer plus tard.";

// Traduit une erreur (ApiError ou Error générique) en message utilisateur,
// en s'appuyant sur `code` quand il est présent.
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "USER_CREDIT_EXHAUSTED":
        // Message de crédits affiché UNIQUEMENT pour ce code. On s'appuie sur
        // le `detail` renvoyé par le backend (source de vérité du libellé
        // exact), avec la constante canonique en repli.
        return error.message || CREDIT_EXHAUSTED_MESSAGE;
      case "AI_PROVIDER_ERROR":
      case "AI_SERVICE_UNAVAILABLE":
        // Message générique : on n'expose jamais le détail d'infrastructure
        // (quota, RESOURCE_EXHAUSTED…) à l'utilisateur.
        return AI_UNAVAILABLE_MESSAGE;
      case "PRESCRIPTION_ANALYSIS_FAILED":
        // Erreur fonctionnelle : on affiche le message métier du backend.
        return error.message || "L'analyse de l'ordonnance a échoué.";
      case "rate_limited":
        return (
          error.message ||
          "Trop de tentatives. Veuillez patienter avant de réessayer."
        );
      default:
        return error.message || "Une erreur est survenue.";
    }
  }

  if (error instanceof Error) {
    // Filet de sécurité : un quota fournisseur (RESOURCE_EXHAUSTED) n'est pas
    // un crédit utilisateur. On affiche le message d'indisponibilité IA
    // générique plutôt qu'un message de crédits insuffisants.
    if (/RESOURCE_EXHAUSTED/i.test(error.message)) {
      return AI_UNAVAILABLE_MESSAGE;
    }
    return error.message;
  }

  return "Une erreur est survenue.";
}
