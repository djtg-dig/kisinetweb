// Tests unitaires ciblés de l'orchestration du refresh JWT (single-flight).
//
// Objectif : vérifier que `authenticatedFetch` et `refreshAccessTokenIfNeeded`
// (dans `lib/api.ts`) ne lancent QU'UN SEUL POST /api/accounts/token/refresh/
// même sous 401 simultanés, et gèrent correctement le cas d'un refresh invalide
// ou d'un retry encore 401.
//
// On remplace le `fetch` bas niveau par une implémentation simulée via
// `setApiFetchImpl` (point d'injection de `lib/api/request.ts`), sans backend.
// `getAccessToken` / `getRefreshToken` / `logout` lisent ou agissent sur
// `localStorage` (et `window`), mockés ici.

import { test } from "node:test";
import assert from "node:assert/strict";

// Base same-origin utilisée par le frontend avant signature HMAC dans le BFF.
const API_BASE = "/api/backend/api";

const ACCESS_KEY = "kisinet:access_token";
const REFRESH_KEY = "kisinet:refresh_token";
const REFRESH_URL = "/api/accounts/token/refresh/";
const LOGOUT_URL = "/api/accounts/logout/";

// --- localStorage mocké (clés kisinet:*) ---
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
};
(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage =
  localStorageMock;

// --- window mocké (requis pour que getAccessToken/getRefreshToken/ logout
// utilisent bien localStorage au lieu de renvoyer "" en environnement node) ---
(globalThis as unknown as { window: unknown }).window = {
  location: { href: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
};

// --- apiFetch mocké (injecté via setApiFetchImpl) ---
type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};
type FetchCall = { url: string; body: unknown; auth: string };

const fetchCalls: FetchCall[] = [];
let apiFetchImpl: (url: string, init: { body?: string; headers?: Record<string, string> | Headers }) => Promise<MockResponse>;

// Les modules sont chargés dynamiquement APRÈS la configuration des globals.
let authenticatedFetch: (input: string, init: { method?: string; headers?: Record<string, string> }) => Promise<MockResponse>;
let setRequestFetchImpl: (impl: typeof apiFetchImpl) => void;

async function setup() {
  const mod = await import("@/lib/api");
  const requestMod = await import("@/lib/api/request");
  authenticatedFetch = mod.authenticatedFetch as unknown as typeof authenticatedFetch;
  setRequestFetchImpl = requestMod.setApiFetchImpl as unknown as typeof setRequestFetchImpl;
}

function seedTokens(access: string, refresh: string) {
  store.set(ACCESS_KEY, access);
  store.set(REFRESH_KEY, refresh);
}

// newAccess : si défini, l'appel métier réussit (200) uniquement quand le header
// Authorization contient ce token ; sinon il renvoie 401.
// refreshResult : réponse simulée du endpoint de refresh.
function setMockBehavior(refreshResult: { status: number; body: Record<string, unknown> }, newAccess?: string) {
  apiFetchImpl = (url: string, init: { body?: string; headers?: Record<string, string> | Headers }) => {
    // `authenticatedFetch` transmet un objet `Headers` (et non un objet plat) ;
    // on lit l'en-tête Authorization de façon robuste dans les deux cas.
    const rawHeaders = init?.headers;
    let auth = "";
    if (rawHeaders) {
      if (typeof (rawHeaders as Headers).get === "function") {
        auth = (rawHeaders as Headers).get("Authorization") || "";
      } else {
        auth = (rawHeaders as Record<string, string>)["Authorization"] || "";
      }
    }
    fetchCalls.push({
      url,
      body: init?.body ? JSON.parse(init.body) : undefined,
      auth,
    });

    if (url.includes(REFRESH_URL)) {
      return Promise.resolve({
        ok: refreshResult.status >= 200 && refreshResult.status < 300,
        status: refreshResult.status,
        json: () => Promise.resolve(refreshResult.body),
      });
    }

    if (url.includes(LOGOUT_URL)) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    }

    if (newAccess && auth.includes(newAccess)) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });
    }
    return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ detail: "expired" }) });
  };

  setRequestFetchImpl(apiFetchImpl);
}

function countRefreshCalls() {
  return fetchCalls.filter((c) => c.url.includes(REFRESH_URL)).length;
}
function countLogoutCalls() {
  return fetchCalls.filter((c) => c.url.includes(LOGOUT_URL)).length;
}

test("1. refresh normal : accès expiré puis rejoué avec le nouveau token", async () => {
  await setup();
  fetchCalls.length = 0;
  store.clear();
  seedTokens("access-expired", "refresh-R1");
  setMockBehavior({ status: 200, body: { access: "access2", refresh: "refresh2" } }, "access2");

  const res = await authenticatedFetch(API_BASE + "/pharmacies/", { method: "GET" });

  assert.equal(res.status, 200, "la requête rejouée réussit");
  assert.equal(countRefreshCalls(), 1, "un seul refresh");
  assert.equal(store.get(ACCESS_KEY), "access2", "nouvel access stocké");
  assert.equal(store.get(REFRESH_KEY), "refresh2", "nouveau refresh stocké");
});

test("2. rotation : access2 et refresh2 remplacent les anciens tokens", async () => {
  await setup();
  fetchCalls.length = 0;
  store.clear();
  seedTokens("access-old", "refresh-old");
  setMockBehavior({ status: 200, body: { access: "access2", refresh: "refresh2" } }, "access2");

  await authenticatedFetch(API_BASE + "/pharmacies/", { method: "GET" });

  assert.equal(store.get(ACCESS_KEY), "access2", "access remplacé");
  assert.equal(store.get(REFRESH_KEY), "refresh2", "refresh remplacé (rotation)");
  assert.equal(countRefreshCalls(), 1);
});

test("3. concurrence : exactement 1 POST refresh pour 2 requêtes 401 simultanées", async () => {
  await setup();
  fetchCalls.length = 0;
  store.clear();
  seedTokens("access-expired", "refresh-R1");
  setMockBehavior({ status: 200, body: { access: "access2", refresh: "refresh2" } }, "access2");

  const results = await Promise.all([
    authenticatedFetch(API_BASE + "/pharmacies/", { method: "GET" }),
    authenticatedFetch(API_BASE + "/pharmacies/", { method: "GET" }),
  ]);

  assert.equal(results.length, 2);
  assert.equal(results.every((r) => r.status === 200), true, "les deux requêtes réussissent");
  assert.equal(countRefreshCalls(), 1, "EXACTEMENT 1 POST /token/refresh/ (single-flight)");
  assert.equal(countLogoutCalls(), 0, "aucun logout exécuté");
  assert.equal(store.get(ACCESS_KEY), "access2", "tokens renouvelés pour les deux");
  assert.equal(store.get(REFRESH_KEY), "refresh2");
});

test("4. refresh réellement invalide : une seule tentative, session invalidée", async () => {
  await setup();
  fetchCalls.length = 0;
  store.clear();
  seedTokens("access-expired", "refresh-invalide");
  setMockBehavior({ status: 401, body: { detail: "Refresh token invalide." } });

  await assert.rejects(
    () => authenticatedFetch(API_BASE + "/pharmacies/", { method: "GET" }),
    (err: unknown) => (err as Error).name === "ApiAuthError",
    "doit lever ApiAuthError",
  );

  assert.equal(countRefreshCalls(), 1, "une seule tentative de refresh (pas de boucle)");
  assert.equal(countLogoutCalls(), 1, "logout cohérent exécuté");
  assert.equal(store.get(ACCESS_KEY), undefined, "logout efface l'access local");
  assert.equal(store.get(REFRESH_KEY), undefined, "logout efface le refresh local");
});

test("5. retry encore 401 : pas de second refresh, session terminée proprement", async () => {
  await setup();
  fetchCalls.length = 0;
  store.clear();
  seedTokens("access-expired", "refresh-R1");
  // Refresh réussit (access2 stocké) mais l'appel métier renvoie 401 même avec
  // le nouveau token (pas de newAccess => toujours 401).
  setMockBehavior({ status: 200, body: { access: "access2", refresh: "refresh-R2" } });

  await assert.rejects(
    () => authenticatedFetch(API_BASE + "/pharmacies/", { method: "GET" }),
    (err: unknown) => (err as Error).name === "ApiAuthError",
    "doit lever ApiAuthError après le retry",
  );

  assert.equal(countRefreshCalls(), 1, "pas de second refresh après le retry 401");
  assert.equal(countLogoutCalls(), 1, "la session est terminée proprement (logout)");
  assert.equal(store.get(ACCESS_KEY), undefined, "logout efface l'access local");
});
