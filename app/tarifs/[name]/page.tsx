"use client";

import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { PlanElements } from "@/components/pricing/plan-elements";
import { getPharmacyPlan, type PharmacyPlan } from "@/lib/api";

type PlanDetailPageProps = {
  params: Promise<{ name: string }>;
};

type PageState = "loading" | "error" | "ready";

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  const [planName, setPlanName] = useState("");
  const [state, setState] = useState<PageState>("loading");
  const [plan, setPlan] = useState<PharmacyPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPlan() {
      const resolvedParams = await params;
      const name = decodeURIComponent(resolvedParams.name);
      setPlanName(name);

      try {
        const pharmacyPlan = await getPharmacyPlan(name);
        setPlan(pharmacyPlan);
        setState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Une erreur inconnue est survenue.");
        setState("error");
      }
    }

    loadPlan();
  }, [params]);

  return (
    <PublicLayout>
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-app-surface to-app-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary-200/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <LinkButton href="/tarifs" variant="secondary" className="mb-8">
              ← Retour
            </LinkButton>

            {state === "loading" && <LoadingBubble label="Chargement du plan" />}

            {state === "error" && (
              <div className="rounded-2xl border border-red-200 bg-app-card p-8 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500 ring-1 ring-red-100">
                  !
                </span>
                <h1 className="mt-4 text-xl font-bold text-app-text">
                  Impossible de charger le plan
                </h1>
                <p className="mt-2 text-sm leading-6 text-app-muted">{errorMessage}</p>
                <LinkButton href="/tarifs" variant="secondary" className="mx-auto mt-6 w-fit">
                  Retour aux tarifs
                </LinkButton>
              </div>
            )}

            {state === "ready" && plan && (
              <article className="rounded-2xl border border-app-border bg-app-card p-7 shadow-soft sm:p-9">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold ${
                      plan.highlighted
                        ? "bg-primary-600 text-white"
                        : "bg-primary-50 text-primary-700 ring-1 ring-primary-100"
                    }`}
                  >
                    {plan.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-app-text sm:text-3xl">
                      {plan.name}
                    </h1>
                    <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
                      {plan.code}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-app-muted sm:text-base">
                  {plan.description}
                </p>

                <div className="mt-6 border-t border-app-border pt-6">
                  <p className="flex items-baseline gap-1 text-4xl font-bold text-app-text">
                    {plan.priceMonthly ? (
                      <>
                        {plan.priceMonthly}
                        {plan.currency ? (
                          <span className="text-lg font-medium text-app-muted">
                            {plan.currency}
                          </span>
                        ) : null}
                        <span className="text-base font-medium text-app-muted">
                          {" "}
                          / mois
                        </span>
                      </>
                    ) : (
                      "Prix à définir"
                    )}
                  </p>
                </div>

                <PlanElements plan={plan} />

                {plan.durations.length > 0 && (
                  <div className="mt-6 border-t border-app-border pt-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-app-muted">
                      Engagements
                    </h2>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {plan.durations.map((duration) => (
                        <li
                          key={duration.durationMonths}
                          className="flex items-center justify-between gap-3 rounded-lg border border-app-border bg-app-background/60 px-4 py-3"
                        >
                          <span className="font-medium text-app-text">
                            {duration.label}
                          </span>
                          <span className="text-right">
                            <span className="block font-semibold text-app-text">
                              {duration.totalAmount}
                              {plan.currency ? (
                                <span className="ml-1 text-xs font-medium text-app-muted">
                                  {plan.currency}
                                </span>
                              ) : null}
                            </span>
                            {duration.discountPercentage > 0 && (
                              <span className="block text-xs font-medium text-success-600">
                                -{duration.discountPercentage}%
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PublicAuthLink
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className="w-full"
                    loggedInHref={
                      plan.highlighted ? "/app/subscription" : "/app/select-pharmacy"
                    }
                    loggedInLabel={plan.highlighted ? "Voir mon abonnement" : "Ouvrir Kisinet"}
                  >
                    Souscrire à {plan.name}
                  </PublicAuthLink>
                </div>
              </article>
            )}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
