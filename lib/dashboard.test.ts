import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardShortcuts } from "./dashboard";

test("les raccourcis du dashboard pointent vers les routes pharmacie existantes", () => {
  const pharmacyId = "PH60A9VC77";

  assert.deepEqual(getDashboardShortcuts(pharmacyId), [
    {
      label: "Nouvelle vente",
      href: "/app/pharmacies/PH60A9VC77/sales/create",
    },
    {
      label: "Ajouter un produit",
      href: "/app/pharmacies/PH60A9VC77/products/create",
    },
    {
      label: "Entrée de stock",
      href: "/app/pharmacies/PH60A9VC77/stock",
    },
    { label: "Produits", href: "/app/pharmacies/PH60A9VC77/products" },
    { label: "Stock", href: "/app/pharmacies/PH60A9VC77/stock" },
    {
      label: "Ventes",
      href: "/app/pharmacies/PH60A9VC77/sales/create",
    },
    { label: "Rapports", href: "/app/pharmacies/PH60A9VC77/reports" },
    { label: "Paramètres", href: "/app/pharmacies/PH60A9VC77/settings" },
  ]);
});
