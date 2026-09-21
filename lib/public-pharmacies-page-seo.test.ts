import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PUBLIC_PHARMACIES_CANONICAL_URL,
  PUBLIC_PHARMACIES_CATALOG_HEADING,
  PUBLIC_PHARMACIES_DESCRIPTION,
  PUBLIC_PHARMACIES_H1,
  PUBLIC_PHARMACIES_INTRO,
  PUBLIC_PHARMACIES_TITLE,
} from "@/lib/public-pharmacies-page-seo";

const projectRoot = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(projectRoot, path), "utf8");
}

describe("public pharmacies page SEO content", () => {
  test("définit un title local sans double suffixe Kisinet", () => {
    assert.equal(PUBLIC_PHARMACIES_TITLE, "Pharmacies référencées");
    assert.ok(!PUBLIC_PHARMACIES_TITLE.includes("| Kisinet"));
    assert.equal(PUBLIC_PHARMACIES_TITLE + " | Kisinet", "Pharmacies référencées | Kisinet");
  });

  test("conserve la canonical publique de la page pharmacies", () => {
    assert.equal(PUBLIC_PHARMACIES_CANONICAL_URL, "https://kisinet.com/pharmacies");

    const pageSource = readProjectFile("app/pharmacies/page.tsx");

    assert.ok(pageSource.includes("canonical: PUBLIC_PHARMACIES_CANONICAL_URL"));
  });

  test("expose une introduction factuelle sans données inventées", () => {
    const content = [
      PUBLIC_PHARMACIES_DESCRIPTION,
      PUBLIC_PHARMACIES_H1,
      PUBLIC_PHARMACIES_INTRO,
      PUBLIC_PHARMACIES_CATALOG_HEADING,
    ].join(" ");

    assert.ok(PUBLIC_PHARMACIES_INTRO.includes("pharmacies publiques référencées"));
    assert.equal(PUBLIC_PHARMACIES_CATALOG_HEADING, "Pharmacies publiques référencées");
    assert.ok(!/meilleures|plus fiables|ouvertes|proches de vous|recommandées/i.test(content));
    assert.ok(!/Kinshasa|RDC|24h|horaire|disponibilit/i.test(content));
    assert.ok(!/\d+ pharmacies/i.test(content));
  });

  test("garde un seul H1 et une hiérarchie H2/H3 pour le catalogue", () => {
    const clientSource = readProjectFile("app/pharmacies/page-client.tsx");

    assert.equal((clientSource.match(/<h1\b/g) || []).length, 1);
    assert.ok(clientSource.includes("{PUBLIC_PHARMACIES_H1}"));
    assert.ok(clientSource.includes("{PUBLIC_PHARMACIES_CATALOG_HEADING}"));
    assert.ok(clientSource.includes("<h3 className=\"mt-1 text-xl font-bold text-app-text\">"));
    assert.ok(clientSource.includes("<p className=\"text-lg font-semibold text-app-text\">"));
    assert.ok(!clientSource.includes("<h2 className=\"mt-1 text-xl font-bold text-app-text\">"));
    assert.ok(!clientSource.includes("<h3 className=\"text-lg font-semibold text-app-text\">"));
  });

  test("conserve les vrais liens HTML vers les fiches publiques", () => {
    const clientSource = readProjectFile("app/pharmacies/page-client.tsx");

    assert.ok(clientSource.includes("<a"));
    assert.ok(
      clientSource.includes(
        'href={"/pharmacies/" + encodeURIComponent(pharmacy.reference || pharmacy.id)}',
      ),
    );
  });
});
