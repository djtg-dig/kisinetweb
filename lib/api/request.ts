// Requête HTTP centralisée de tout le frontend.

// Chaque appel réseau vers le backend passe par `apiFetch`. Quand le backend est
// injoignable (serveur arrêté, absence de réseau, DNS, timeout, CORS…), le
// `fetch` natif lève une erreur technique (ex. « Failed to fetch »,
// « NetworkError », « fetch failed »). On la capture ici pour la remplacer par
// un message utilisateur unique et compréhensible, sans jamais exposer le
// détail technique (ni dans l'interface, ni dans la console du navigateur).

import { NETWORK_ERROR_MESSAGE } from "./errors";

// Nom du cookie CSRF émis par `/api/auth/csrf` et du header attendu par le BFF
// `/api/backend/*` sur les méthodes mutatrices. Sans ce header, le BFF rejette
// la requête en 403 (csrf_failed) et le frontend afficherait alors à tort
// « Vous n'avez pas l'autorisation d'effectuer cette action. » alors qu'il
// s'agit d'une simple protection CSRF côté frontend.
const CSRF_COOKIE_NAME = "kisinet_csrf";
const CSRF_HEADER_NAME = "X-Kisinet-CSRF";

function isMutationMethod(method: string | undefined): boolean {
  if (!method) {
    return false;
  }
  const normalized = method.toUpperCase();
  return normalized === "POST" || normalized === "PUT" || normalized === "PATCH" || normalized === "DELETE";
}

function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp("(^| )" + CSRF_COOKIE_NAME + "=([^;]+)"),
  );
  return match ? match[2] : null;
}

// Injecte automatiquement l'en-tête CSRF sur les méthodes mutatrices si le
// cookie correspondant existe déjà. On reste tolérant si le cookie n'est pas
// encore présent : le BFF renverra alors son propre 403 (csrf_failed) que les
// helpers d'API traduiront, sans planter la requête côté client.
function applyCsrfHeader(init?: RequestInit): RequestInit {
  if (!init || !isMutationMethod(init.method)) {
    return init ?? {};
  }
  const csrfToken = readCsrfTokenFromCookie();
  if (!csrfToken) {
    return init;
  }
  const headers = new Headers(init.headers);
  if (!headers.has(CSRF_HEADER_NAME)) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }
  return { ...init, headers };
}

// Point d'injection réservé aux tests unitaires : il permet de remplacer le
// `fetch` natif par une implémentation simulée, sans backend. En production
// cette fonction n'est jamais appelée et `apiFetch` utilise toujours le
// `fetch` natif (valeur par défaut ci-dessous).
type ApiFetchImpl = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

let apiFetchImpl: ApiFetchImpl = (input, init) => fetch(input, init);

export function setApiFetchImpl(impl: ApiFetchImpl): void {
  apiFetchImpl = impl;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const preparedInit = applyCsrfHeader(init);
  try {
    return await apiFetchImpl(input, preparedInit);
  } catch {
    // Le détail technique reste interne : on ne le journalise pas afin qu'il
    // n'apparaisse ni à l'utilisateur ni dans la console du navigateur. La page
    // reçoit uniquement le message générique NETWORK_ERROR_MESSAGE.
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
}
