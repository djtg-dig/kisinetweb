import type { PharmacyPlan } from "@/lib/api";

export type PlanElement = { label: string; value: string };

export function buildPlanElements(plan: PharmacyPlan): PlanElement[] {
  const elements: PlanElement[] = [];

  const usersLabel = plan.maxUsers === null
    ? "Utilisateurs illimités"
    : plan.maxUsers === 1
      ? "1 utilisateur"
      : "Jusqu'à " + plan.maxUsers + " utilisateurs";
  elements.push({ label: "Utilisateurs", value: usersLabel + " (propriétaire compris)" });

  if (plan.unlimitedProducts) {
    elements.push({ label: "Produits", value: "Illimité" });
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
