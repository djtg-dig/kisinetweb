import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BACKEND_URL = "http://django.test";

type CapturedFetch = {
  url: URL;
  method: string;
  headers: Headers;
  cache?: RequestCache;
  next?: {
    revalidate?: number;
  };
};

async function loadPublicPricingPlans() {
  process.env.KISINET_BACKEND_URL = BACKEND_URL;
  process.env.KISINET_HMAC_CLIENT_ID = "kisinet-web";
  process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";
  process.env.KISINET_HMAC_SECRET = "test-hmac-secret-for-public-pricing";

  return import("@/lib/server/public-pricing-plans");
}

function mockPricingPlansResponse(data: unknown, init?: ResponseInit) {
  const calls: CapturedFetch[] = [];

  globalThis.fetch = ((input: RequestInfo | URL, requestInit?: RequestInit) => {
    calls.push({
      url: input instanceof URL ? input : new URL(String(input)),
      method: requestInit?.method ?? "GET",
      headers: new Headers(requestInit?.headers),
      cache: requestInit?.cache,
      next: (requestInit as RequestInit & { next?: { revalidate?: number } })?.next,
    });

    return Promise.resolve(Response.json(data, init));
  }) as typeof fetch;

  return calls;
}

describe("getPublicPricingPlansServer", () => {
  test("charge et normalise les plans publics avec HMAC et cache ISR", async () => {
    const {
      getPublicPricingPlansServerUncached,
      PUBLIC_PRICING_PLANS_REVALIDATE_SECONDS,
    } = await loadPublicPricingPlans();
    const calls = mockPricingPlansResponse({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 7,
          code: "PRO",
          name: "Professionnel",
          description: "Pour les pharmacies en croissance",
          price_monthly: "25.00",
          currency: "USD",
          max_users: null,
          unlimited_products: true,
          features: [{ label: "Stock", enabled: true }],
          analysis_credits: {
            enabled: true,
            label: "Crédits d'analyse",
            monthly_analysis_credits: 100,
            per_user_monthly_analysis_credits: 10,
          },
          highlighted: true,
        },
      ],
    });

    const plans = await getPublicPricingPlansServerUncached();

    assert.equal(plans.length, 1);
    assert.equal(plans[0]?.name, "Professionnel");
    assert.equal(plans[0]?.priceMonthly, "25.00");
    assert.equal(plans[0]?.currency, "USD");
    assert.equal(plans[0]?.features[0]?.label, "Stock");
    assert.equal(plans[0]?.analysisCredits?.perUserMonthlyAnalysisCredits, 10);

    const call = calls[0];
    assert.ok(call);
    assert.equal(call.url.href, BACKEND_URL + "/api/paiements/pharmacy-plans/");
    assert.equal(call.method, "GET");
    assert.equal(call.headers.get("Accept"), "application/json");
    assert.equal(call.headers.get("X-Kisinet-Client-Id"), "kisinet-web");
    assert.ok(call.headers.get("X-Kisinet-Signature"));
    assert.equal(call.cache, "force-cache");
    assert.equal(call.next?.revalidate, PUBLIC_PRICING_PLANS_REVALIDATE_SECONDS);
  });

  test("accepte aussi une réponse en tableau brut", async () => {
    const { getPublicPricingPlansServerUncached } = await loadPublicPricingPlans();
    mockPricingPlansResponse([
      {
        id: 8,
        code: "STARTER",
        name: "Starter",
        tagline: "Premier pas",
        price_per_user_month: "12.00",
        currency: "USD",
        features: {
          export_pdf: true,
        },
      },
    ]);

    const plans = await getPublicPricingPlansServerUncached();

    assert.equal(plans[0]?.name, "Starter");
    assert.equal(plans[0]?.description, "Premier pas");
    assert.equal(plans[0]?.pricePerUserMonth, "12.00");
    assert.equal(plans[0]?.featuresMap?.export_pdf, true);
    assert.deepEqual(plans[0]?.features, [{ label: "export_pdf", enabled: true }]);
  });

  test("remonte une erreur maîtrisée si le backend échoue", async () => {
    const { getPublicPricingPlansServerUncached } = await loadPublicPricingPlans();
    mockPricingPlansResponse({ detail: "Service indisponible" }, { status: 503 });

    await assert.rejects(
      getPublicPricingPlansServerUncached(),
      /Impossible de charger les tarifs publics/,
    );
  });
});

describe("page tarifs server-first", () => {
  test("le wrapper serveur transmet initialPlans et gère l'erreur backend", () => {
    const source = readFileSync(
      join(process.cwd(), "app/tarifs/page.tsx"),
      "utf8",
    );

    assert.match(source, /getPublicPricingPlansServer/);
    assert.match(source, /initialPlans=\{initialPlans\}/);
    assert.match(source, /initialLoadError=/);
  });

  test("le client utilise initialPlans sans double fetch initial", () => {
    const source = readFileSync(
      join(process.cwd(), "app/tarifs/page-client.tsx"),
      "utf8",
    );

    assert.match(source, /initialPlans: PharmacyPlan\[\]/);
    assert.match(source, /useState<PharmacyPlan\[\]>\(initialPlans\)/);
    assert.match(source, /href=\{"\/tarifs\/" \+ encodeURIComponent\(plan\.name\)\}/);
    assert.doesNotMatch(source, /getPharmacyPlans/);
    assert.doesNotMatch(source, /useEffect/);
    assert.doesNotMatch(source, /loadPlans/);
  });
});
