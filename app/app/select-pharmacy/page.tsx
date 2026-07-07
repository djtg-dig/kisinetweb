"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { getUserPharmacies, type PharmacySummary } from "@/lib/api";
import { LAST_PHARMACY_KEY, saveTokensFromUrlHash } from "@/lib/auth";

type PageState = "loading" | "error" | "empty" | "ready" | "redirecting";

export default function SelectPharmacyPage() {
  const [state, setState] = useState<PageState>("loading");
  const [pharmacies, setPharmacies] = useState<PharmacySummary[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPharmacies() {
      try {
        // Le callback OAuth arrive ici avec #access=...&refresh=...
        saveTokensFromUrlHash();

        const userPharmacies = await getUserPharmacies();
        setPharmacies(userPharmacies);
        setState(userPharmacies.length === 0 ? "empty" : "ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Une erreur inconnue est survenue.");
        setState("error");
      }
    }

    loadPharmacies();
  }, []);

  function openPharmacy(pharmacyId: string) {
    // Cette valeur servira a la prochaine connexion.
    localStorage.setItem(LAST_PHARMACY_KEY, pharmacyId);
    setState("redirecting");
    window.location.href = "/app/pharmacies/" + pharmacyId + "/dashboard";
  }

  return (
    <MainLayout>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full">
          {state === "loading" && <LoadingState />}
          {state === "redirecting" && <RedirectingState />}
          {state === "error" && <ErrorState message={errorMessage} />}
          {state === "empty" && <EmptyState />}
          {state === "ready" && (
            <ReadyState pharmacies={pharmacies} onOpenPharmacy={openPharmacy} />
          )}
        </div>
      </section>
    </MainLayout>
  );
}

function LoadingState() {
  return (
    <CenteredCard>
      <p className="text-sm font-semibold text-primary-700">Chargement</p>
      <h1 className="mt-3 text-2xl font-bold text-app-text">Préparation de votre espace</h1>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        Nous récupérons les pharmacies accessibles à votre compte.
      </p>
    </CenteredCard>
  );
}

function RedirectingState() {
  return (
    <CenteredCard>
      <p className="text-sm font-semibold text-success-700">Redirection en cours</p>
      <h1 className="mt-3 text-2xl font-bold text-app-text">Ouverture de votre pharmacie</h1>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        Votre dernière pharmacie utilisée est encore accessible.
      </p>
    </CenteredCard>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <CenteredCard>
      <p className="text-sm font-semibold text-red-600">Erreur de chargement</p>
      <h1 className="mt-3 text-2xl font-bold text-app-text">Impossible de charger vos pharmacies</h1>
      <p className="mt-3 text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton href="/" className="mt-6">
        Retour à l’accueil
      </LinkButton>
    </CenteredCard>
  );
}

function EmptyState() {
  return (
    <CenteredCard>
      <h1 className="text-3xl font-bold text-app-text">Bienvenue sur Kisinet</h1>
      <p className="mt-3 text-base leading-7 text-app-muted">
        Vous n’avez aucune pharmacie.
      </p>
    </CenteredCard>
  );
}

function ReadyState({
  pharmacies,
  onOpenPharmacy,
}: {
  pharmacies: PharmacySummary[];
  onOpenPharmacy: (pharmacyId: string) => void;
}) {
  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Espace de travail
        </p>
        <h1 className="mt-3 text-3xl font-bold text-app-text">Choisissez une pharmacie</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted sm:text-base">
          Sélectionnez l’espace de travail que vous voulez utiliser.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {pharmacies.map((pharmacy) => (
          <article
            key={pharmacy.id}
            className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-app-text">{pharmacy.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  {pharmacy.role && (
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700 ring-1 ring-primary-100">
                      {pharmacy.role}
                    </span>
                  )}
                  {pharmacy.status && (
                    <span className="rounded-full bg-success-50 px-3 py-1 text-success-700 ring-1 ring-success-100">
                      {pharmacy.status}
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={() => onOpenPharmacy(pharmacy.id)}>Ouvrir</Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/app/pharmacies/create">Créer une pharmacie</LinkButton>
        <LinkButton href="/app/pharmacies/join" variant="secondary">
          Rejoindre une pharmacie
        </LinkButton>
      </div>
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-app-border bg-app-card px-6 py-10 text-center shadow-soft sm:px-10">
      {children}
    </div>
  );
}
