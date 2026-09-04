// Tests unitaires de la couche API notifications.
//
// Ils valident le contrat consomme par la page pharmacie sans backend reel :
// filtres de liste, compteurs pharmacie et synchronisation du badge.

import { test } from "node:test";
import assert from "node:assert/strict";

const API_BASE = "/api/backend";
const ACCESS_KEY = "kisinet:access_token";
const REFRESH_KEY = "kisinet:refresh_token";
const REFRESH_URL = "/api/accounts/token/refresh/";

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
};

let lastDispatchedEvent = "";
(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage =
  localStorageMock;
(globalThis as unknown as { CustomEvent: typeof CustomEvent }).CustomEvent = class {
  type: string;

  constructor(type: string) {
    this.type = type;
  }
} as typeof CustomEvent;
(globalThis as unknown as { window: unknown }).window = {
  dispatchEvent: (event: Event) => {
    lastDispatchedEvent = event.type;
    return true;
  },
};

type CapturedRequest = {
  url: string;
  method?: string;
  body?: string;
  authorization?: string;
};

let capturedRequests: CapturedRequest[] = [];
let forceFirstNotifications401 = false;

async function setup() {
  const notifications = await import("./notifications.ts");
  const request = await import("./request.ts");
  request.setApiFetchImpl((input, init) => {
    const headers = init?.headers;
    const authorization =
      typeof (headers as Headers | undefined)?.get === "function"
        ? (headers as Headers).get("Authorization") || undefined
        : (headers as Record<string, string> | undefined)?.Authorization;
    capturedRequests.push({
      url: String(input),
      method: init?.method,
      body: typeof init?.body === "string" ? init.body : undefined,
      authorization,
    });

    if (String(input).includes(REFRESH_URL)) {
      return Promise.resolve(
        new Response(JSON.stringify({ access: "access-refreshed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    if (forceFirstNotifications401 && capturedRequests.length === 1) {
      return Promise.resolve(
        new Response(JSON.stringify({ detail: "token expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    if (String(input).includes("/api/notifications/unread-count/")) {
      return Promise.resolve(
        new Response(JSON.stringify({ count: 4 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    if (String(input).includes("/api/notifications/unread-summary/")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            total: 4,
            groups: {
              payments: 0,
              commissions: 0,
              products: 3,
              ai_credits: 1,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              reference: "NT12345678",
              category: "PRODUCT_EXPIRATION",
              severity: "WARNING",
              title: "Produit bientôt expiré",
              message: "Amoxicilline expire dans 15 jours.",
              pharmacy_reference: "PH12345678",
              pharmacy_name: "Pharmacie Centrale",
              action_url: "/app/pharmacies/PH12345678/products/PR12345678",
              source_type: "PRODUCT",
              source_reference: "PR12345678",
              is_read: false,
              read_at: null,
              created_at: "2026-09-01T10:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
  });
  return notifications;
}

test("getNotifications transmet les filtres supportes par le backend", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = false;
  store.set(ACCESS_KEY, "access-token");

  const result = await notifications.getNotifications({
    category: "PRODUCT_EXPIRATION",
    pharmacy: "PH12345678",
    is_read: false,
    page: "2",
    page_size: "20",
  });

  const request = capturedRequests[0];
  const url = new URL(request.url, "http://test.local");
  assert.equal(url.pathname, "/api/backend/api/notifications/");
  assert.equal(url.searchParams.get("category"), "PRODUCT_EXPIRATION");
  assert.equal(url.searchParams.get("pharmacy"), "PH12345678");
  assert.equal(url.searchParams.get("is_read"), "false");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("page_size"), "20");
  assert.equal(request.authorization, "Bearer access-token");
  assert.equal(result.results[0]?.pharmacy_name, "Pharmacie Centrale");
});

test("getNotificationCount utilise une page legere pour lire count", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = false;
  store.set(ACCESS_KEY, "access-token");

  const count = await notifications.getNotificationCount({
    pharmacy: "PH12345678",
    is_read: true,
  });

  const url = new URL(capturedRequests[0]!.url, "http://test.local");
  assert.equal(count, 2);
  assert.equal(url.searchParams.get("pharmacy"), "PH12345678");
  assert.equal(url.searchParams.get("is_read"), "true");
  assert.equal(url.searchParams.get("page_size"), "1");
});

test("getUnreadNotificationCount transmet le filtre pharmacie au backend", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = false;
  store.set(ACCESS_KEY, "access-token");

  const count = await notifications.getUnreadNotificationCount({ pharmacy: "PH12345678" });

  const url = new URL(capturedRequests[0]!.url, "http://test.local");
  assert.equal(count, 4);
  assert.equal(url.pathname, "/api/backend/api/notifications/unread-count/");
  assert.equal(url.searchParams.get("pharmacy"), "PH12345678");
});

test("getUnreadNotificationSummary transmet le filtre pharmacie au backend", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = false;
  store.set(ACCESS_KEY, "access-token");

  const summary = await notifications.getUnreadNotificationSummary({ pharmacy: "PH12345678" });

  const url = new URL(capturedRequests[0]!.url, "http://test.local");
  assert.equal(summary.total, 4);
  assert.equal(summary.groups.products, 3);
  assert.equal(url.pathname, "/api/backend/api/notifications/unread-summary/");
  assert.equal(url.searchParams.get("pharmacy"), "PH12345678");
});

test("markNotificationAsRead declenche le rafraichissement du badge", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = false;
  lastDispatchedEvent = "";
  store.set(ACCESS_KEY, "access-token");

  await notifications.markNotificationAsRead("NT12345678");

  assert.equal(capturedRequests[0]?.method, "POST");
  assert.equal(new URL(capturedRequests[0]!.url, "http://localhost").pathname, "/api/backend/api/notifications/NT12345678/read/");
  assert.equal(lastDispatchedEvent, notifications.NOTIFICATION_BADGE_REFRESH_EVENT);
});

test("markAllNotificationsAsRead envoie le filtre pharmacie au backend", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = false;
  lastDispatchedEvent = "";
  store.set(ACCESS_KEY, "access-token");

  await notifications.markAllNotificationsAsRead({ pharmacy: "PH12345678" });

  const request = capturedRequests[0];
  assert.equal(request?.method, "POST");
  assert.equal(new URL(request!.url, "http://localhost").pathname, "/api/backend/api/notifications/read-all/");
  assert.deepEqual(JSON.parse(request!.body || "{}"), { pharmacy: "PH12345678" });
  assert.equal(lastDispatchedEvent, notifications.NOTIFICATION_BADGE_REFRESH_EVENT);
});

test("getNotifications rafraichit le JWT expire puis rejoue la requete", async () => {
  const notifications = await setup();
  capturedRequests = [];
  forceFirstNotifications401 = true;
  store.set(ACCESS_KEY, "access-expired");
  store.set(REFRESH_KEY, "refresh-valid");

  await notifications.getNotifications({ pharmacy: "PH12345678" });

  assert.equal(capturedRequests.length, 3);
  assert.equal(capturedRequests[0]?.authorization, "Bearer access-expired");
  assert.equal(new URL(capturedRequests[1]!.url, "http://localhost").pathname, "/api/backend/api/accounts/token/refresh/");
  assert.equal(capturedRequests[2]?.authorization, "Bearer access-refreshed");
  assert.equal(store.get(ACCESS_KEY), "access-refreshed");
});
