import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { PharmacySummary } from "@/lib/api";
import {
  buildLocationLabel,
  buildPublicPharmacyIntro,
  buildPublicPharmacyMetadataDescription,
  buildPublicPharmacyMetadataTitle,
} from "@/lib/public-pharmacy-seo";

function makePharmacy(overrides: Partial<PharmacySummary> = {}): PharmacySummary {
  return {
    id: "PH0TEST",
    reference: "PH0TEST",
    name: "Pharmacie Test",
    isPublic: true,
    ...overrides,
  };
}

describe("public pharmacy SEO content", () => {
  test("génère un titre metadata neutre avec cityOrProvince", () => {
    assert.equal(
      buildPublicPharmacyMetadataTitle(
        makePharmacy({ cityOrProvince: "Kinshasa", country: "RDC" }),
      ),
      "Pharmacie Test | Kinshasa | Kisinet",
    );

    assert.equal(
      buildPublicPharmacyMetadataTitle(
        makePharmacy({ cityOrProvince: "Kongo Central", country: "RDC" }),
      ),
      "Pharmacie Test | Kongo Central | Kisinet",
    );

    assert.equal(
      buildPublicPharmacyMetadataTitle(makePharmacy({ country: "RDC" })),
      "Pharmacie Test | Kisinet",
    );
  });

  test("utilise la description publique réelle avant tout texte généré", () => {
    assert.equal(
      buildPublicPharmacyMetadataDescription(
        makePharmacy({
          description: "  Pharmacie de garde du quartier.  ",
          cityOrProvince: "Kinshasa",
          country: "RDC",
        }),
      ),
      "Pharmacie de garde du quartier.",
    );
  });

  test("génère une intro neutre qui ne suppose pas le type géographique", () => {
    assert.equal(
      buildPublicPharmacyIntro(
        makePharmacy({ cityOrProvince: "Kinshasa", country: "RDC" }),
      ),
      "Pharmacie Test est une pharmacie référencée sur Kisinet.",
    );

    assert.equal(
      buildPublicPharmacyIntro(
        makePharmacy({ cityOrProvince: "Kongo Central", country: "RDC" }),
      ),
      "Pharmacie Test est une pharmacie référencée sur Kisinet.",
    );

    assert.equal(
      buildPublicPharmacyIntro(makePharmacy()),
      "Pharmacie Test est une pharmacie référencée sur Kisinet.",
    );
  });

  test("compose la localisation sans inventer les champs absents", () => {
    assert.equal(
      buildLocationLabel(
        makePharmacy({
          neighborhood: "Gombe",
          cityOrProvince: "Kinshasa",
          country: "RDC",
        }),
        { includeNeighborhood: true },
      ),
      "Gombe, Kinshasa, RDC",
    );

    assert.equal(
      buildLocationLabel(makePharmacy({ neighborhood: "Gombe" })),
      "",
    );
  });

  test("n'invente pas de disponibilité, note, horaires ou services", () => {
    const description = buildPublicPharmacyMetadataDescription(makePharmacy());

    assert.ok(!description.includes("24h"));
    assert.ok(!description.includes("service"));
    assert.ok(!description.includes("disponible"));
    assert.ok(!description.includes("avis"));
    assert.ok(!description.includes("note"));
    assert.ok(!description.includes("Pharmacie à"));
    assert.ok(!description.includes("située à"));
  });
});
