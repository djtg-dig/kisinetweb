import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(projectRoot, path), "utf8");
}

describe("home page SEO editorial content", () => {
  test("définit un title local sans double suffixe Kisinet", () => {
    const source = readProjectFile("app/page.tsx");

    assert.ok(source.includes('const title = "Gestion de pharmacie";'));
    assert.ok(source.includes("title,"));
    assert.ok(!source.includes("absolute: title + \" | Kisinet\""));
    assert.ok(!source.includes("title: title + \" | Kisinet\""));
  });

  test("conserve la canonical et une meta description factuelle", () => {
    const source = readProjectFile("app/page.tsx");

    assert.ok(source.includes('const url = "https://kisinet.com/";'));
    assert.ok(source.includes("canonical: url"));
    assert.ok(
      source.includes(
        "Kisinet centralise la gestion des produits, stocks, ventes, factures, expirations et accès d'équipe pour les pharmacies.",
      ),
    );
  });

  test("présente un H1 unique et des sections H2/H3 cohérentes", () => {
    const source = readProjectFile("app/page.tsx");

    assert.equal((source.match(/<h1\b/g) || []).length, 1);
    assert.ok(source.includes("Kisinet, plateforme de gestion pour pharmacies."));
    assert.ok(source.includes("Une solution conçue pour la gestion quotidienne des pharmacies"));
    assert.ok(source.includes("Fonctionnalités de Kisinet"));
    assert.ok(source.includes("Consultez les pharmacies publiques et les tarifs"));
    assert.ok(source.includes("Centralisez la gestion de votre pharmacie"));
    assert.ok(source.includes("Suivez les opérations essentielles de votre pharmacie"));
    assert.ok(source.includes("Questions fréquentes"));
    assert.ok(source.includes("<h3 className=\"font-semibold text-app-text\">{faq.question}</h3>"));
    assert.ok(!source.includes("Une solution conçue pour les vrais circuits de santé"));
    assert.ok(!source.includes("Moins d'oublis, plus de visibilité."));
  });

  test("conserve des liens HTML descriptifs vers les pharmacies publiques et les tarifs", () => {
    const source = readProjectFile("app/page.tsx");

    assert.ok(source.includes('href="/pharmacies"'));
    assert.ok(source.includes("Consulter les pharmacies"));
    assert.ok(source.includes('href="/tarifs"'));
    assert.ok(source.includes("Voir les tarifs"));
    assert.ok(!source.includes("cliquez ici"));
  });

  test("garde la FAQ visible cohérente avec le JSON-LD FAQPage", () => {
    const source = readProjectFile("app/page.tsx");

    assert.ok(source.includes("const faqs = ["));
    assert.ok(source.includes("const homeJsonLd = getHomeJsonLd(siteUrl, description, faqs);"));
    assert.ok(source.includes("{faqs.map((faq) => ("));
    assert.ok(source.includes("{faq.question}"));
    assert.ok(source.includes("{faq.answer}"));
  });

  test("ne contient pas de métriques inventées ni de promesses fictives", () => {
    const pageSource = readProjectFile("app/page.tsx");
    const featuresSource = readProjectFile("lib/features.ts");
    const content = pageSource + "\n" + featuresSource;

    for (const forbidden of ["5 min", "24/7", "1+", "1 284", "430 unités", "74%"]) {
      assert.ok(!content.includes(forbidden), forbidden);
    }

    assert.ok(!/meilleur logiciel|n°1|100 % fiable|révolutionnaire/i.test(content));
    assert.ok(!/diagnostic médical|recommandation médicale|comprend toutes les ordonnances/i.test(content));
    assert.ok(content.includes("analyse d'ordonnances assistée par intelligence artificielle"));
  });
});
