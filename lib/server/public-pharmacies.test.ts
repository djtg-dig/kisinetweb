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
