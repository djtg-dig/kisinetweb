"use client";

import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getPharmacyPlans, type PharmacyPlan } from "@/lib/api";
import { PlanElements } from "@/components/pricing/plan-elements";

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
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-app-surface to-app-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary-200/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex w-fit rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-200">
                Tarifs
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight text-app-text sm:text-4xl lg:text-5xl">
                Des plans préparés pour chaque étape
              </h1>
              <p className="mt-4 text-sm leading-6 text-app-muted sm:text-base">
                Choisissez l'offre qui correspond à la taille et aux besoins de votre
                pharmacie.
              </p>
            </div>

            <div className="mt-12">
              {state === "loading" && <LoadingBubble label="Chargement des tarifs" />}

              {state === "error" && (
                <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-app-card p-8 text-center shadow-sm">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500 ring-1 ring-red-100">
                    !
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-app-text">
                    Impossible de charger les tarifs
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-app-muted">
                    {errorMessage}
                  </p>
                  <PublicAuthLink
                    variant="secondary"
                    className="mx-auto mt-6 w-fit"
                    loggedInHref="/app/select-pharmacy"
                    loggedInLabel="Ouvrir Kisinet"
                  >
                    Se connecter
                  </PublicAuthLink>
                </div>
              )}

              {state === "ready" && (
                <div className="grid items-stretch gap-6 md:grid-cols-3">
                  {plans.map((plan) => (
                    <article
                      key={plan.id || plan.name}
                      className={`relative flex flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-soft sm:p-6 lg:p-7 ${
                        plan.highlighted
                          ? "border-primary-600 bg-app-card shadow-soft ring-1 ring-primary-200"
                          : "border-app-border bg-app-card shadow-sm"
                      }`}
                    >
                      {plan.highlighted && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                          Populaire
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${
                            plan.highlighted
                              ? "bg-primary-600 text-white"
                              : "bg-primary-50 text-primary-700 ring-1 ring-primary-100"
                          }`}
                        >
                          {plan.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <h2 className="text-xl font-bold text-app-text">{plan.name}</h2>
                          <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
                            {plan.code}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-5 text-app-muted">
                        {plan.description}
                      </p>

                      <div className="mt-4 border-t border-app-border pt-4">
                        <p className="flex items-baseline gap-1 text-3xl font-bold text-app-text">
                          {plan.priceMonthly ? (
                            <>
                              {plan.priceMonthly}
                              {plan.currency ? (
                                <span className="text-base font-medium text-app-muted">
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
                      </div>

                      <PlanElements plan={plan} />

                      <div className="mt-auto pt-7">
                        <LinkButton
                          href={"/tarifs/" + encodeURIComponent(plan.name)}
                          variant={plan.highlighted ? "primary" : "secondary"}
                          className="w-full"
                        >
                          Sélectionner
                        </LinkButton>
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
