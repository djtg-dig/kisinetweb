import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd, getHomeJsonLd, getPharmacyJsonLd } from "@/lib/server/json-ld";

describe("serializeJsonLd", () => {
  test("échappe les chevrons pour éviter l'injection de script", () => {
    const input = { text: "</script><script>alert('xss')</script>" };
    const output = serializeJsonLd(input);
    assert.ok(!output.includes("</script>"));
    assert.ok(output.includes("\\u003c/script>"));
    assert.ok(output.includes("\\u003cscript>"));
  });

  test("produit du JSON valide", () => {
    const input = { "@type": "WebSite", "name": "Kisinet" };
    const output = serializeJsonLd(input);
    assert.deepEqual(JSON.parse(output), input);
  });
});

describe("getHomeJsonLd", () => {
  test("génère WebSite, SoftwareApplication et FAQPage", () => {
    const result = getHomeJsonLd("https://kisinet.com", "Description test", [
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ]);

    assert.equal(result["@context"], "https://schema.org");
    assert.ok(Array.isArray(result["@graph"]));
    assert.equal(result["@graph"].length, 3);

    const types = result["@graph"].map((item: Record<string, unknown>) => item["@type"]);
    assert.deepEqual(types, ["WebSite", "SoftwareApplication", "FAQPage"]);

    const faqPage = result["@graph"].find(
      (item: Record<string, unknown>) => item["@type"] === "FAQPage",
    );
    assert.ok(faqPage);
    assert.ok(Array.isArray(faqPage.mainEntity));
    assert.equal(faqPage.mainEntity.length, 2);
    assert.deepEqual(faqPage.mainEntity[0], {
      "@type": "Question",
      name: "Q1",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A1",
      },
    });
  });
});

describe("getPharmacyJsonLd", () => {
  test("normalise le pays RDC vers le code ISO CD", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "PH0TEST",
      description: "Description test",
      phoneNumber: "+243900000000",
      email: "test@example.com",
      street: "123 Rue Test",
      cityOrProvince: "Kinshasa",
      country: "RDC",
    });

    assert.ok(result);
    assert.equal(result["@type"], "Pharmacy");
    assert.equal(result.name, "Pharmacie Test");
    assert.equal(result.url, "https://kisinet.com/pharmacies/PH0TEST");
    assert.equal(result.description, "Description test");
    assert.equal(result.telephone, "+243900000000");
    assert.equal(result.email, "test@example.com");

    const address = result.address as Record<string, unknown>;
    assert.equal(address["@type"], "PostalAddress");
    assert.equal(address.streetAddress, "123 Rue Test");
    assert.equal(address.addressLocality, "Kinshasa");
    assert.equal(address.addressCountry, "CD");
  });

  test("utilise neighborhood quand street est absent", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "PH0TEST",
      neighborhood: "Gombe",
      cityOrProvince: "Kinshasa",
      country: "RDC",
    });

    assert.ok(result);
    const address = result.address as Record<string, unknown>;
    assert.equal(address.streetAddress, "Gombe");
    assert.equal(address.addressCountry, "CD");
  });

  test("retourne null pour une référence vide", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "   ",
    });
    assert.equal(result, null);
  });

  test("exclut les champs absents", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "PH0TEST",
    });

    assert.ok(result);
    assert.equal(result.description, undefined);
    assert.equal(result.telephone, undefined);
    assert.equal(result.email, undefined);
    assert.equal(result.address, undefined);
  });

  test("n'ajoute pas de propriétés fictives sans données réelles", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "PH0TEST",
      cityOrProvince: "Kinshasa",
      country: "RDC",
    });

    assert.ok(result);
    assert.equal(result.aggregateRating, undefined);
    assert.equal(result.review, undefined);
    assert.equal(result.openingHours, undefined);
    assert.equal(result.priceRange, undefined);
  });

  test("conserve un code ISO déjà valide", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "PH0TEST",
      country: "CD",
    });

    assert.ok(result);
    const address = result.address as Record<string, unknown>;
    assert.equal(address.addressCountry, "CD");
  });

  test("conserve une valeur de pays inconnue", () => {
    const result = getPharmacyJsonLd("https://kisinet.com", {
      name: "Pharmacie Test",
      reference: "PH0TEST",
      country: "PaysInconnu",
    });

    assert.ok(result);
    const address = result.address as Record<string, unknown>;
    assert.equal(address.addressCountry, "PaysInconnu");
  });

  test("normalise plusieurs variantes de la RDC vers CD", () => {
    const variants = [
      "RDC",
      "RD Congo",
      "République démocratique du Congo",
      "Democratic Republic of the Congo",
    ];

    for (const variant of variants) {
      const result = getPharmacyJsonLd("https://kisinet.com", {
        name: "Pharmacie Test",
        reference: "PH0TEST",
        country: variant,
      });

      assert.ok(result);
      const address = result.address as Record<string, unknown>;
      assert.equal(address.addressCountry, "CD", `Failed for: ${variant}`);
    }
  });
});
