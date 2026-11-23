import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildPlanElements } from "@/components/pricing/plan-elements";
import type { PharmacyPlan, PharmacyPlanFeature } from "@/lib/api";
import { getPlanFeatureLabel } from "./feature-labels";

function makePlan(
  code: string,
  features: PharmacyPlanFeature[],
): PharmacyPlan {
  return {
    id: 1,
    code,
    name: code,
    description: "",
    maxUsers: 1,
    maxBranches: null,
    unlimitedUsers: false,
    unlimitedProducts: false,
    unlimitedBranches: false,
    features,
    durations: [],
  };
}

describe("getPlanFeatureLabel", () => {
  test("traduit les identifiants techniques des fonctionnalités de forfait", () => {
    const expectedLabels: Record<string, string> = {
      sales: "Gestion des ventes",
      stock: "Gestion des stocks",
      reports: "Rapports et statistiques",
      invoices: "Gestion des factures",
      products: "Gestion des produits",
      notifications: "Notifications",
      can_export_csv: "Export CSV",
      can_export_pdf: "Export PDF",
      can_export_excel: "Export Excel",
      roles_permissions: "Gestion des rôles et permissions",
      employee_management: "Gestion des employés",
      expiry_dates: "Gestion des dates de péremption",
      external_api_access: "Accès à l’API externe",
    };

    for (const [feature, label] of Object.entries(expectedLabels)) {
      assert.equal(getPlanFeatureLabel(feature), label);
    }
  });

  test("conserve les libellés déjà lisibles et formate une clé inconnue", () => {
    assert.equal(getPlanFeatureLabel("Gestion des ventes"), "Gestion des ventes");
    assert.equal(getPlanFeatureLabel("advanced_inventory_alerts"), "Advanced inventory alerts");
  });
});

describe("buildPlanElements", () => {
  test("autorise le retour à la ligne de la limite d'utilisateurs", () => {
    const standardPlan = makePlan("STANDARD", []);
    standardPlan.maxUsers = 10;
    const [usersElement] = buildPlanElements(standardPlan);

    assert.deepEqual(usersElement, {
      label: "Utilisateurs",
      value: "Jusqu'à 10 utilisateurs (propriétaire compris)",
      kind: "users",
    });
  });

  test("affiche les fonctionnalités inchangées des trois forfaits avec un statut distinct", () => {
    const plans = [
      makePlan("BASIC", [
        { label: "sales", enabled: true },
        { label: "stock", enabled: true },
      ]),
      makePlan("STANDARD", [
        { label: "invoices", enabled: true },
        { label: "products", enabled: true },
        { label: "can_export_csv", enabled: true },
      ]),
      makePlan("ENTERPRISE", [
        { label: "roles_permissions", enabled: true },
        { label: "employee_management", enabled: true },
        { label: "external_api_access", enabled: true },
      ]),
    ];

    assert.deepEqual(
      plans.map((plan) => plan.features.map((feature) => feature.label)),
      [
        ["sales", "stock"],
        ["invoices", "products", "can_export_csv"],
        ["roles_permissions", "employee_management", "external_api_access"],
      ],
    );
    assert.deepEqual(
      plans.map((plan) =>
        buildPlanElements(plan)
          .filter((element) => element.value === "Inclus")
          .map((element) => [element.label, element.value]),
      ),
      [
        [["Gestion des ventes", "Inclus"], ["Gestion des stocks", "Inclus"]],
        [
          ["Gestion des factures", "Inclus"],
          ["Gestion des produits", "Inclus"],
          ["Export CSV", "Inclus"],
        ],
        [
          ["Gestion des rôles et permissions", "Inclus"],
          ["Gestion des employés", "Inclus"],
          ["Accès à l’API externe", "Inclus"],
        ],
      ],
    );
  });
});
