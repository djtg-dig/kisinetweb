import { afterEach, test } from "node:test";
import assert from "node:assert/strict";

import {
  createPharmacy,
  updatePharmacyGeneralSettings,
} from "@/lib/api";
import { setApiFetchImpl } from "@/lib/api/request";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

afterEach(() => {
  setApiFetchImpl((input, init) => fetch(input, init));
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete (globalThis as { window?: unknown }).window;
  if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
  else delete (globalThis as { document?: unknown }).document;
});

function installCsrfCookie() {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { cookie: "kisinet_csrf=" + "a".repeat(64) }, configurable: true,
  });
}

test("crée une pharmacie privée puis utilise les paramètres généraux pour la publier", async () => {
  installCsrfCookie();
  const calls: { url: string; init?: RequestInit }[] = [];
  setApiFetchImpl(async (input, init) => {
    calls.push({ url: String(input), init });

    if (calls.length === 1) {
      return Response.json({
        reference: "PH12345678",
        name: "Pharmacie Centrale",
        devise: "CDF",
      }, { status: 201 });
    }

    return Response.json({ receipt_paper_width: 80, is_public: true });
  });

  const pharmacy = await createPharmacy({
    name: "Pharmacie Centrale",
    country: "+243",
    cityOrProvince: "3",
    street: "Avenue du Commerce 12",
    neighborhood: "Gombe",
  });
  await updatePharmacyGeneralSettings(pharmacy.id, { isPublic: true });

  assert.equal(calls[0]?.url, "/api/backend/api/pharmacies/");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    name: "Pharmacie Centrale",
    devise: "USD",
    adresse: {
      country: "+243",
      city_or_province: "3",
      street: "Avenue du Commerce 12",
      neighborhood: "Gombe",
    },
  });
  assert.equal(calls[1]?.url, "/api/backend/api/pharmacies/PH12345678/general-settings/");
  assert.equal(calls[1]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), { is_public: true });
});
