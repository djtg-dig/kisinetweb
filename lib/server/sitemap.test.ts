import { describe, test } from "node:test";
import assert from "node:assert/strict";

async function loadSitemap() {
  process.env.KISINET_BACKEND_URL = "http://django.test";
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = "test-hmac-secret-for-sitemap";

  return import("@/app/sitemap");
}

function mockSitemapPages(pages: unknown[]) {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const index = calls.length;
    const url = input instanceof URL ? input.href : String(input);
    const page = pages[index];

    calls.push(url);

    if (page instanceof Response) {
      return Promise.resolve(page);
    }

    return Promise.resolve(Response.json(page));
  }) as typeof fetch;

  const calls: string[] = [];

  return calls;
}

describe("sitemap", () => {
  test("conserve les routes statiques et ajoute les pharmacies publiques valides sans doublon", async () => {
    const { default: sitemap } = await loadSitemap();

    mockSitemapPages([
      {
        count: 4,
        next: null,
        previous: null,
        results: [
          {
            id: 41,
            reference: "PH0SEO001",
            name: "Pharmacie SEO",
            is_public: true,
          },
          {
            id: 42,
            reference: "PH0SEO001",
            name: "Pharmacie SEO doublon",
            is_public: true,
          },
          {
            id: 43,
            reference: "PH0PRIVATE",
            name: "Pharmacie Privée",
            is_public: false,
          },
          {
            id: 44,
            reference: "",
            name: "Pharmacie Sans Référence",
            is_public: true,
          },
        ],
      },
    ]);

    const routes = await sitemap();
    const urls = routes.map((route) => route.url);

    assert.ok(urls.includes("https://kisinet.com"));
    assert.ok(urls.includes("https://kisinet.com/pharmacies"));
    assert.ok(urls.includes("https://kisinet.com/tarifs"));
    assert.ok(urls.includes("https://kisinet.com/contact"));
    assert.ok(urls.includes("https://kisinet.com/terms"));
    assert.ok(urls.includes("https://kisinet.com/cookies"));
    assert.equal(
      urls.filter((url) => url === "https://kisinet.com/pharmacies/PH0SEO001")
        .length,
      1,
    );
    assert.equal(urls.some((url) => url.includes("PH0PRIVATE")), false);
    assert.equal(urls.some((url) => url.includes("?")), false);
    assert.equal(urls.some((url) => url.includes("/tarifs/[")), false);
  });

  test("retourne uniquement le sitemap statique si le backend échoue", async () => {
    const { default: sitemap } = await loadSitemap();
    const originalError = console.error;

    console.error = () => undefined;
    mockSitemapPages([
      Response.json({ detail: "Service indisponible" }, { status: 503 }),
    ]);

    try {
      const routes = await sitemap();
      const urls = routes.map((route) => route.url);

      assert.deepEqual(urls, [
        "https://kisinet.com",
        "https://kisinet.com/pharmacies",
        "https://kisinet.com/tarifs",
        "https://kisinet.com/contact",
        "https://kisinet.com/terms",
        "https://kisinet.com/cookies",
      ]);
    } finally {
      console.error = originalError;
    }
  });

  test("retourne uniquement le sitemap statique si la liste publique est vide", async () => {
    const { default: sitemap } = await loadSitemap();

    mockSitemapPages([
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    ]);

    const routes = await sitemap();

    assert.equal(routes.length, 6);
  });
});
