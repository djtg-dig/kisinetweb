import type { PharmacyPlan } from "@/lib/api";

export type PlanElement = { label: string; value: string };

export function buildPlanElements(plan: PharmacyPlan): PlanElement[] {
  const elements: PlanElement[] = [];

  // Modele seat-based : tous les plans permettent d'ajouter autant
  // d'utilisateurs que necessaire, la facturation suivant le nombre
  // d'utilisateurs actifs.
  elements.push({ label: "Utilisateurs", value: "Illimité" });

  if (plan.unlimitedProducts) {
    elements.push({ label: "Produits", value: "Illimité" });
  }

  // Credits IA inclus par utilisateur et par mois (priorite au champ
  // seat-based, repli sur l'ancien champ analysisCredits).
  const aiCreditsPerUser = plan.includedAiCreditPerUserMonth
    ? plan.includedAiCreditPerUserMonth
    : plan.analysisCredits?.enabled
      ? plan.analysisCredits.perUserMonthlyAnalysisCredits
      : 0;
  if (aiCreditsPerUser > 0) {
    elements.push({
      label: "Crédits IA inclus",
      value: formatCredits(aiCreditsPerUser) + " / utilisateur / mois",
    });
  }

  if (plan.unlimitedBranches) {
    elements.push({ label: "Succursales", value: "Illimité" });
  } else if (plan.maxBranches && plan.maxBranches !== 0) {
    elements.push({ label: "Succursales", value: String(plan.maxBranches) });
  }

  for (const feature of plan.features) {
    if (feature.enabled && feature.label !== "Crédits d'analyse") {
      elements.push({ label: feature.label, value: "Inclus" });
    }
  }

  return elements;
}

function formatCredits(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function PlanElements({ plan }: { plan: PharmacyPlan }) {
  const elements = buildPlanElements(plan);

  if (elements.length === 0) {
    return null;
  }

  return (
    <ul className="mt-5 grid gap-2 border-t border-app-border pt-5 text-sm">
      {elements.map((element) => (
        <li
          key={element.label}
          className="flex items-center justify-between gap-3 rounded-lg bg-app-background/60 px-3 py-2"
        >
          <span className="flex items-center gap-2 text-app-muted">
            <span className="text-success-600">✓</span>
            {element.label}
          </span>
          <span className="font-semibold text-app-text">{element.value}</span>
        </li>
      ))}
    </ul>
  );
}
