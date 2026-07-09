"use client";

import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getPharmacyPlans, type PharmacyPlan } from "@/lib/api";

type PageState = "loading" | "error" | "ready";

export default function TarifsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [plans, setPlans] = useState<PharmacyPlan[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPlans() {
      try {
        const pharmacyPlans = await getPharmacyPlans();
        setPlans(pharmacyPlans);
        setState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Une erreur inconnue est survenue.");
        setState("error");
      }
    }

    loadPlans();
  }, []);

  return (
    <PublicLayout>
      <main>
        <section className="bg-app-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
              Tarifs
            </p>
            <h1 className="mt-3 text-3xl font-bold text-app-text sm:text-4xl">
              Des plans préparés pour chaque étape
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted sm:text-base">
              Choisissez l'offre qui correspond à la taille et aux besoins de votre
              pharmacie.
            </p>

            <div className="mt-10">
              {state === "loading" && <LoadingBubble label="Chargement des tarifs" />}

              {state === "error" && (
                <div className="rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
                  <p className="text-sm font-semibold text-red-600">
                    Erreur de chargement
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-app-text">
                    Impossible de charger les tarifs
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-app-muted">
                    {errorMessage}
                  </p>
                  <PublicAuthLink
                    variant="secondary"
                    className="mt-5"
                    loggedInHref="/app/select-pharmacy"
                    loggedInLabel="Ouvrir Kisinet"
                  >
                    Se connecter
                  </PublicAuthLink>
                </div>
              )}

              {state === "ready" && (
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => (
                    <article
                      key={plan.id || plan.name}
                      className={`flex flex-col rounded-lg border p-6 ${
                        plan.highlighted
                          ? "border-primary-600 bg-primary-50 shadow-soft"
                          : "border-app-border bg-app-card"
                      }`}
                    >
                      <h2 className="text-xl font-bold text-app-text">{plan.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-app-muted">
                        {plan.description}
                      </p>

                      <p className="mt-6 text-2xl font-bold text-app-text">
                        {plan.priceMonthly ? (
                          <>
                            {plan.priceMonthly}
                            {plan.currency ? (
                              <span className="ml-1 text-base font-medium text-app-muted">
                                {plan.currency}
                              </span>
                            ) : null}
                            <span className="text-sm font-medium text-app-muted">
                              {" "}
                              / mois
                            </span>
                          </>
                        ) : (
                          "Prix à définir"
                        )}
                      </p>

                      <PlanElements plan={plan} />

                      <div className="mt-auto pt-6">
                        <PublicAuthLink
                          variant={plan.highlighted ? "primary" : "secondary"}
                          className="w-full"
                          loggedInHref={
                            plan.highlighted
                              ? "/app/subscription"
                              : "/app/select-pharmacy"
                          }
                          loggedInLabel={
                            plan.highlighted ? "Voir mon abonnement" : "Ouvrir Kisinet"
                          }
                        >
                          {plan.highlighted ? "Choisir ce plan" : "Se connecter"}
                        </PublicAuthLink>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

type PlanElement = { label: string; value: string };

function buildPlanElements(plan: PharmacyPlan): PlanElement[] {
  const elements: PlanElement[] = [];

  if (plan.unlimitedUsers) {
    elements.push({ label: "Utilisateurs", value: "Illimité" });
  } else if (plan.maxUsers && plan.maxUsers !== 0) {
    elements.push({ label: "Utilisateurs", value: String(plan.maxUsers) });
  }

  if (plan.unlimitedProducts) {
    elements.push({ label: "Produits", value: "Illimité" });
  }

  if (plan.unlimitedBranches) {
    elements.push({ label: "Succursales", value: "Illimité" });
  } else if (plan.maxBranches && plan.maxBranches !== 0) {
    elements.push({ label: "Succursales", value: String(plan.maxBranches) });
  }

  for (const feature of plan.features) {
    if (feature.enabled) {
      elements.push({ label: feature.label, value: "Inclus" });
    }
  }

  return elements;
}

function PlanElements({ plan }: { plan: PharmacyPlan }) {
  const elements = buildPlanElements(plan);

  if (elements.length === 0) {
    return null;
  }

  return (
    <ul className="mt-5 grid gap-2 border-t border-app-border pt-5 text-sm">
      {elements.map((element) => (
        <li key={element.label} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-app-muted">
            <span className="text-success-600">●</span>
            {element.label}
          </span>
          <span className="font-semibold text-app-text">{element.value}</span>
        </li>
      ))}
    </ul>
  );
}
