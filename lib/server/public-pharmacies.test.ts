import { describe, test } from "node:test";
import assert from "node:assert/strict";

async function loadPublicPharmacies() {
  process.env.KISINET_BACKEND_URL = "http://django.test";
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = "test-hmac-secret-for-public-pharmacies";

  return import("@/lib/server/public-pharmacies");
}

function mockPublicPharmaciesResponse(results: unknown[]) {
  globalThis.fetch = (() =>
    Promise.resolve(
      Response.json({
        count: results.length,
        next: null,
        previous: null,
        results,
      }),
    )) as typeof fetch;
}

function mockPublicPharmaciesPages(pages: unknown[]) {
  const calls: string[] = [];

  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = input instanceof URL ? input.href : String(input);
    const page = pages[calls.length];

    calls.push(url);

    if (page instanceof Response) {
      return Promise.resolve(page);
    }

    return Promise.resolve(Response.json(page));
  }) as typeof fetch;

  return calls;
}

describe("getPublicPharmacyByReferenceServer", () => {
  test("retourne une pharmacie explicitement publique", async () => {
    const { getPublicPharmacyByReferenceServer } = await loadPublicPharmacies();
    mockPublicPharmaciesResponse([
      {
        id: 12,
        reference: "PH0PUBLIC",
        name: "Pharmacie Publique",
        is_public: true,
      },
    ]);

    const pharmacy = await getPublicPharmacyByReferenceServer("PH0PUBLIC");

    assert.equal(pharmacy?.reference, "PH0PUBLIC");
    assert.equal(pharmacy?.isPublic, true);
  });

  test("ignore une pharmacie non explicitement publique", async () => {
    const { getPublicPharmacyByReferenceServer } = await loadPublicPharmacies();
    mockPublicPharmaciesResponse([
      {
        id: 13,
        reference: "PH0PRIVATE",
        name: "Pharmacie Privée",
        is_public: false,
      },
    ]);

    const pharmacy = await getPublicPharmacyByReferenceServer("PH0PRIVATE");

    assert.equal(pharmacy, null);
  });
});

describe("getAllPublicPharmaciesForSitemapServer", () => {
  test("récupère toutes les pages paginées", async () => {
    const { getAllPublicPharmaciesForSitemapServer } = await loadPublicPharmacies();
    const calls = mockPublicPharmaciesPages([
      {
        count: 2,
        next: "http://django.test/api/pharmacies/public/?page=2",
        previous: null,
        results: [
          {
            id: 21,
            reference: "PH0PAGE01",
            name: "Pharmacie Page 1",
            is_public: true,
          },
        ],
      },
      {
        count: 2,
        next: null,
        previous: "http://django.test/api/pharmacies/public/?page=1",
        results: [
          {
            id: 22,
            reference: "PH0PAGE02",
            name: "Pharmacie Page 2",
            is_public: true,
          },
        ],
      },
    ]);

    const pharmacies = await getAllPublicPharmaciesForSitemapServer();

    assert.deepEqual(
      pharmacies.map((pharmacy) => pharmacy.reference),
      ["PH0PAGE01", "PH0PAGE02"],
    );
    assert.equal(calls.length, 2);
    assert.ok(calls[0]?.endsWith("/api/pharmacies/public/?page=1"));
    assert.ok(calls[1]?.endsWith("/api/pharmacies/public/?page=2"));
    assert.ok(!calls[0]?.includes("/api/pharmacies/public?page=1"));
    assert.ok(!calls[1]?.includes("/api/pharmacies/public?page=2"));
  });

  test("ignore les pharmacies privées et les références absentes", async () => {
    const { getAllPublicPharmaciesForSitemapServer } = await loadPublicPharmacies();
    mockPublicPharmaciesPages([
      {
        count: 3,
        next: null,
        previous: null,
        results: [
          {
            id: 31,
            reference: "PH0PUBLIC2",
            name: "Pharmacie Publique 2",
            is_public: true,
          },
          {
            id: 32,
            reference: "PH0PRIVATE2",
            name: "Pharmacie Privée 2",
            is_public: false,
          },
          {
            id: 33,
            reference: "",
            name: "Pharmacie Sans Référence",
            is_public: true,
          },
        ],
      },
    ]);

    const pharmacies = await getAllPublicPharmaciesForSitemapServer();

    assert.deepEqual(
      pharmacies.map((pharmacy) => pharmacy.reference),
      ["PH0PUBLIC2"],
    );
  });

  test("remonte une erreur si le backend échoue", async () => {
    const { getAllPublicPharmaciesForSitemapServer } = await loadPublicPharmacies();
    mockPublicPharmaciesPages([
      Response.json({ detail: "Service indisponible" }, { status: 503 }),
    ]);

    await assert.rejects(
      getAllPublicPharmaciesForSitemapServer(),
      /pharmacies publiques du sitemap/,
    );
  });
});
