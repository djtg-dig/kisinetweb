import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(projectRoot, path), "utf8");
}

describe("public secondary pages SEO content", () => {
  test("conserve une page contact indexable avec une canonical absolue", () => {
    const source = readProjectFile("app/contact/page.tsx");

    assert.ok(source.includes('const title = "Contact";'));
    assert.ok(!source.includes('"Contact | Kisinet"'));
    assert.ok(source.includes('const url = "https://kisinet.com/contact";'));
    assert.ok(source.includes("canonical: url"));
    assert.equal((source.match(/<h1\b/g) || []).length, 1);
    assert.equal((source.match(/<h[23]\b/g) || []).length, 1);
    assert.ok(source.includes("Une question&nbsp;? Contactez-nous"));
  });

  test("n'affiche pas de coordonnées non confirmées sur la page contact", () => {
    const source = readProjectFile("app/contact/page.tsx");

    assert.ok(source.includes("contact@kisinet.com"));
    assert.ok(!source.includes("+243 81 9339 737"));
    assert.ok(!source.includes("Kinshasa, République Démocratique du Congo"));
    assert.ok(!source.includes(">Téléphone<"));
    assert.ok(!source.includes(">Adresse<"));
    assert.ok(!source.includes("[Adresse officielle]"));
  });

  test("rend la page contact accessible depuis la navigation publique", () => {
    const publicLayoutSource = readProjectFile("components/layout/public-layout.tsx");
    const footerSource = readProjectFile("components/layout/site-footer.tsx");

    assert.ok(publicLayoutSource.includes('{ label: "Contact", href: "/contact" }'));
    assert.ok(footerSource.includes('{ label: "Contact", href: "/contact" }'));
  });

  test("conserve les metadata propres des conditions d'utilisation", () => {
    const source = readProjectFile("app/terms/page.tsx");

    assert.ok(source.includes("title: \"Conditions d'utilisation\""));
    assert.ok(!source.includes("\"Conditions d'utilisation | Kisinet\""));
    assert.ok(source.includes('const url = "https://kisinet.com/terms";'));
    assert.ok(source.includes("canonical: url"));
    assert.ok(source.includes("url,"));
    assert.equal((source.match(/<h1\b/g) || []).length, 1);
    assert.ok(source.includes("Dernière mise à jour : {lastUpdated}"));
    assert.ok(source.includes("robots:"));
    assert.ok(source.includes("index: true"));
    assert.ok(!source.includes("[Adresse officielle]"));
    assert.ok(source.includes("contact@kisinet.com"));
  });

  test("conserve les metadata propres de la politique de cookies", () => {
    const source = readProjectFile("app/cookies/page.tsx");

    assert.ok(source.includes('title: "Politique relative aux cookies"'));
    assert.ok(!source.includes('"Politique relative aux cookies | Kisinet"'));
    assert.ok(source.includes('const url = "https://kisinet.com/cookies";'));
    assert.ok(source.includes("canonical: url"));
    assert.ok(source.includes("url,"));
    assert.equal((source.match(/<h1\b/g) || []).length, 1);
    assert.ok(source.includes("Dernière mise à jour : {lastUpdated}"));
    assert.ok(source.includes("robots:"));
    assert.ok(source.includes("index: true"));
    assert.ok(!source.includes("[À confirmer avant la mise en production]"));
    assert.ok(!source.includes("[Adresse officielle]"));
    assert.ok(source.includes("contact@kisinet.com"));
  });
});
