const PLAN_FEATURE_LABELS: Record<string, string> = {
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

/**
 * Transforme une clé de fonctionnalité renvoyée par l'API en libellé destiné
 * à l'interface, sans modifier la clé utilisée pour les échanges backend.
 */
export function getPlanFeatureLabel(feature: string): string {
  const trimmedFeature = feature.trim();
  const knownLabel = PLAN_FEATURE_LABELS[trimmedFeature];

  if (knownLabel) {
    return knownLabel;
  }

  // Les libellés déjà fournis par l'API sont conservés. Les clés inconnues
  // restent visibles, mais sous une forme lisible plutôt qu'avec des underscores.
  if (!/[_-]/.test(trimmedFeature)) {
    return trimmedFeature;
  }

  const readableFeature = trimmedFeature
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return readableFeature.charAt(0).toUpperCase() + readableFeature.slice(1);
}
