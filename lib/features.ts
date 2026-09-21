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
    description: "Suivez les quantités, les stocks faibles et les dates d'expiration.",
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
    title: "Rapports et IA",
    description: "Consultez les indicateurs utiles et l'analyse d'ordonnances assistée par intelligence artificielle.",
    badge: "Analyse",
    icon: "IA",
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
