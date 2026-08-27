// Tests ciblés du client API des rapports.
//
// Objectif : vérifier que le frontend sait lire le format paginé réellement
// renvoyé par le backend des rapports (`data`) sans perdre les lignes à afficher.

import { test } from "node:test";
import assert from "node:assert/strict";

// Base définie avant l'import dynamique du module métier.
process.env.NEXT_PUBLIC_API_BASE_URL = "http://test.local";

type FetchInit = RequestInit | undefined;
type FetchCall = { url: string; init: FetchInit };

const fetchCalls: FetchCall[] = [];

// `authenticatedFetch` consulte `window`/`localStorage` même dans ces tests Node.
const localStorageMock = {
  getItem: () => "access-token",
  setItem: () => {},
  removeItem: () => {},
};
(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;
(globalThis as unknown as { window: unknown }).window = {
  location: { href: "" },
  addEventListener: () => {},
  removeEventListener: () => {},
};

test("getSalesReport lit les ventes paginées dans le champ data du backend", async () => {
  const { getSalesReport } = await import("./api/reports.ts");
  const { setApiFetchImpl } = await import("./api/request.ts");

  setApiFetchImpl((input, init) => {
    fetchCalls.push({ url: String(input), init });

    return Promise.resolve(
      new Response(
        JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          summary: {
            sales_count: 1,
            items_sold: 3,
            revenue: "3000.00",
          },
          data: [
            {
              reference: "SEL1234567",
              date: "2026-08-27T12:00:00Z",
              user: { full_name: "Jane Doe" },
              total: "3000.00",
              items_count: 3,
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  });

  const report = await getSalesReport("PH60A9VC77", { page: "1" });

  assert.equal(fetchCalls[0]?.url, "http://test.local/api/pharmacies/PH60A9VC77/reports/sales/?page=1");
  assert.equal(report.count, 1);
  assert.equal(report.results.length, 1);
  assert.equal(report.results[0]?.reference, "SEL1234567");
  assert.equal(report.summary.revenue, 3000);
});
