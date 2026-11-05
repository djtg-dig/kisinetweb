// Requête HTTP centralisée de tout le frontend.

// Chaque appel réseau vers le backend passe par `apiFetch`. Quand le backend est
// injoignable (serveur arrêté, absence de réseau, DNS, timeout, CORS…), le
// `fetch` natif lève une erreur technique (ex. « Failed to fetch »,
// « NetworkError », « fetch failed »). On la capture ici pour la remplacer par
// un message utilisateur unique et compréhensible, sans jamais exposer le
// détail technique (ni dans l'interface, ni dans la console du navigateur).

import { NETWORK_ERROR_MESSAGE } from "./errors";
import { ensureCsrfToken } from "@/lib/auth";

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
  try {
    const method = (init?.method || "GET").toUpperCase();
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const headers = new Headers(init?.headers);

    if (isMutation) {
      const csrfToken = await ensureCsrfToken();
      if (csrfToken && !headers.has("X-Kisinet-CSRF")) {
        headers.set("X-Kisinet-CSRF", csrfToken);
      }
    }

    return await apiFetchImpl(input, {
      ...init,
      headers,
      ...(isMutation ? { credentials: "include" } : {}),
    });
  } catch {
    // Le détail technique reste interne : on ne le journalise pas afin qu'il
    // n'apparaisse ni à l'utilisateur ni dans la console du navigateur. La page
    // reçoit uniquement le message générique NETWORK_ERROR_MESSAGE.
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
}
