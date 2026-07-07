import type { Feature } from "@/types/feature";

export const features: Feature[] = [
  {
    title: "Gestion des pharmacies",
    description: "Centralisez les informations de chaque pharmacie dans un espace clair.",
    badge: "Organisation",
    icon: "PH",
    tone: "primary",
  },
  {
    title: "Produits et médicaments",
    description: "Classez les médicaments et produits sans créer de boutique en ligne.",
    badge: "Catalogue",
    icon: "RX",
    tone: "info",
  },
  {
    title: "Stock et alertes",
    description: "Suivez les quantités et repérez rapidement les stocks faibles.",
    badge: "Alertes",
    icon: "ST",
    tone: "warning",
  },
  {
    title: "Ventes et factures",
    description: "Gardez une trace lisible des ventes et des documents associés.",
    badge: "Caisse",
    icon: "VF",
    tone: "success",
  },
  {
    title: "Rapports",
    description: "Consultez les indicateurs utiles pour piloter l'activité.",
    badge: "Analyse",
    icon: "RP",
    tone: "info",
  },
  {
    title: "Équipe et permissions",
    description: "Invitez vos employés et préparez des accès adaptés aux rôles.",
    badge: "Sécurité",
    icon: "EQ",
    tone: "primary",
  },
];
