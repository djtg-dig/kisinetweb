import type { PharmacyPlan } from "@/lib/api";
import { getPlanFeatureLabel } from "@/lib/pricing/feature-labels";

export type PlanElement = {
  label: string;
  value: string;
  kind?: "users";
};

export function buildPlanElements(plan: PharmacyPlan): PlanElement[] {
  const elements: PlanElement[] = [];
  const displayedFeatureLabels = new Set<string>();

  const usersLabel = plan.maxUsers === null
    ? "Utilisateurs illimités"
    : plan.maxUsers === 1
      ? "1 utilisateur"
      : "Jusqu'à " + plan.maxUsers + " utilisateurs";
  elements.push({
    label: "Utilisateurs",
    value: usersLabel + " (propriétaire compris)",
    kind: "users",
  });

  if (plan.unlimitedProducts) {
    elements.push({ label: "Produits", value: "Illimité" });
  }

  if (plan.unlimitedBranches) {
    elements.push({ label: "Succursales", value: "Illimité" });
  } else if (plan.maxBranches && plan.maxBranches !== 0) {
    elements.push({ label: "Succursales", value: String(plan.maxBranches) });
  }

  for (const feature of plan.features) {
    const featureLabel = getPlanFeatureLabel(feature.label);

    if (
      feature.enabled &&
      feature.label !== "Crédits d'analyse" &&
      featureLabel &&
      !displayedFeatureLabels.has(featureLabel)
    ) {
      displayedFeatureLabels.add(featureLabel);
      elements.push({ label: featureLabel, value: "Inclus" });
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
          className="flex w-full min-w-0 items-start justify-between gap-3 rounded-lg bg-app-background/60 px-3 py-2"
        >
          <span className="flex min-w-0 flex-1 items-start gap-2 text-app-muted">
            <span className="shrink-0 text-success-600">✓</span>
            <span className="min-w-0 break-words">{element.label}</span>
          </span>
          <span
            className={
              element.kind === "users"
                ? "min-w-0 flex-1 break-words text-right font-semibold text-app-text"
                : "shrink-0 whitespace-nowrap font-semibold text-app-text"
            }
          >
            {element.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
