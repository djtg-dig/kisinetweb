import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardShortcuts, getDashboardSubscriptionAlert } from "./dashboard";

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

test("affiche une alerte d'abonnement expiré quel que soit le nombre de jours écoulés", () => {
  const now = new Date("2026-11-20T12:00:00+01:00");

  for (const expiresAt of ["2026-11-12", "2026-11-19"]) {
    const alert = getDashboardSubscriptionAlert({ status: "EXPIRED", expiresAt }, now);

    assert.deepEqual(alert, {
      id: "subscription",
      title: "Abonnement expiré",
      description:
        "L'abonnement de cette pharmacie a expiré le " +
        (expiresAt === "2026-11-12" ? "12 novembre 2026" : "19 novembre 2026") +
        ". Veuillez renouveler votre abonnement pour continuer à utiliser les fonctionnalités concernées.",
      tone: "error",
      action: {
        kind: "renew-subscription",
        label: "Renouveler l'abonnement",
      },
    });
  }
});

test("affiche une alerte bientôt expiré seulement pour un abonnement actif signalé par le backend", () => {
  const alert = getDashboardSubscriptionAlert(
    { status: "ACTIVE", expiresAt: "2026-11-21" },
    new Date("2026-11-20T12:00:00+01:00"),
  );

  assert.deepEqual(alert, {
    id: "subscription",
    title: "Abonnement bientôt expiré",
    description:
      "Votre abonnement expirera le 21 novembre 2026. Pensez à le renouveler pour éviter une interruption du service.",
    tone: "warning",
  });
});

test("n'affiche pas d'alerte pour un abonnement actif loin de son expiration ou renouvelé", () => {
  const now = new Date("2026-11-20T12:00:00+01:00");

  // L'absence d'alerte dans le payload dashboard signifie que le seuil backend
  // n'est pas atteint, y compris après un renouvellement.
  assert.equal(getDashboardSubscriptionAlert(null, now), null);
});

test("n'affiche pas d'alerte future pour un essai terminé ou une date invalide", () => {
  const now = new Date("2026-11-20T12:00:00+01:00");

  assert.equal(getDashboardSubscriptionAlert({ status: "TRIAL", expiresAt: "2026-11-19" }, now), null);
  assert.equal(getDashboardSubscriptionAlert({ status: "ACTIVE", expiresAt: "invalide" }, now), null);
  assert.equal(getDashboardSubscriptionAlert({ status: "ACTIVE", expiresAt: undefined }, now), null);
});

test("affiche un libellé adapté pour un essai encore actif proche de sa fin", () => {
  const alert = getDashboardSubscriptionAlert(
    { status: "TRIAL", expiresAt: "2026-11-21" },
    new Date("2026-11-20T12:00:00+01:00"),
  );

  assert.deepEqual(alert, {
    id: "subscription",
    title: "Période d'essai bientôt terminée",
    description:
      "Votre période d'essai se terminera le 21 novembre 2026. Pensez à souscrire un abonnement pour éviter une interruption du service.",
    tone: "warning",
  });
});
