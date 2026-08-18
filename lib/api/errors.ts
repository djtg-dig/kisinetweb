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

// Message unique et professionnel affiché à l'utilisateur lorsque le backend
// (ou le réseau) est injoignable. Aucun détail technique n'y figure.
export const NETWORK_ERROR_MESSAGE =
  "Impossible de contacter le serveur.\n\nVeuillez vérifier votre connexion Internet ou réessayer dans quelques instants.";

// Détecte une erreur réseau (serveur arrêté, pas de connexion, DNS, timeout,
// CORS, fetch failed, NetworkError, ECONNREFUSED, ERR_CONNECTION_REFUSED…)
// par opposition à une erreur métier renvoyée par l'API.
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message || "";
    if (
      /Failed to fetch/i.test(message) ||
      /NetworkError/i.test(message) ||
      /fetch failed/i.test(message) ||
      /Network request failed/i.test(message) ||
      /ECONNREFUSED/i.test(message) ||
      /ENOTFOUND/i.test(message) ||
      /ETIMEDOUT/i.test(message) ||
      /ECONNRESET/i.test(message) ||
      /ERR_CONNECTION_REFUSED/i.test(message) ||
      /UND_ERR/i.test(message)
    ) {
      return true;
    }
  }

  // Requête interrompue (timeout applicatif, démontage de composant, etc.).
  const errorName =
    error instanceof DOMException
      ? error.name
      : typeof error === "object" && error !== null
        ? (error as { name?: string }).name
        : undefined;
  if (errorName === "AbortError") {
    return true;
  }

  // Node/undici imbrique la cause réseau dans `error.cause`.
  if (typeof error === "object" && error !== null) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause) {
      return isNetworkError(cause);
    }
  }

  return false;
}

// Traduit une erreur réseau en message utilisateur unique. Aucun détail
// technique n'est journalisé afin de ne jamais l'exposer (interface ou console).
export function describeNetworkError(_error: unknown): string {
  return NETWORK_ERROR_MESSAGE;
}

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
    // Erreur réseau : le backend est injoignable. On affiche le message unique
    // et professionnel, sans aucun détail technique.
    if (isNetworkError(error)) {
      return NETWORK_ERROR_MESSAGE;
    }
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
