"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { getActivePharmacyId } from "@/lib/auth";

type AppErrorScreenProps = {
  error: Error & { digest?: string };
  reset?: () => void;
};

export function AppErrorScreen({ error, reset }: AppErrorScreenProps) {
  const [dashboardHref, setDashboardHref] = useState("/app/select-pharmacy");

  useEffect(() => {
    // On garde les détails techniques dans la console pour le débogage.
    console.error("Erreur capturée par Kisinet:", error);
  }, [error]);

  useEffect(() => {
    // La pharmacie active est stockée côté navigateur.
    const activePharmacyId = getActivePharmacyId();

    if (activePharmacyId) {
      setDashboardHref("/app/pharmacies/" + activePharmacyId + "/dashboard");
    }
  }, []);

  function retry() {
    if (reset) {
      reset();
      return;
    }

    window.location.reload();
  }

  return (
    <main className="flex min-h-screen items-center bg-app-background px-4 py-12 text-app-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-app-border bg-app-card p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600 ring-1 ring-red-100">
          !
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
          Kisinet
        </p>
        <h1 className="mt-3 text-3xl font-bold text-app-text sm:text-4xl">
          Une erreur s'est produite
        </h1>
        <div className="mx-auto mt-5 max-w-2xl space-y-3 text-sm leading-7 text-app-muted sm:text-base">
          <p>Une erreur inattendue est survenue lors du traitement de votre demande.</p>
          <p>Veuillez réessayer dans quelques instants.</p>
          <p>Si le problème persiste, contactez l'administrateur de votre pharmacie.</p>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={retry} className="w-full sm:w-auto">
            Réessayer
          </Button>
          <LinkButton href={dashboardHref} variant="secondary" className="w-full sm:w-auto">
            Retour au tableau de bord
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
