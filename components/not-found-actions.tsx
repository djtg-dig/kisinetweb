"use client";

import { useSession } from "@/lib/hooks/use-session";
import { getActivePharmacyId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

export function NotFoundActions() {
  const { authenticated, loading } = useSession();

  const getPrimaryAction = () => {
    if (loading || !authenticated) {
      return { href: "/", label: "Retour à l'accueil" };
    }

    const activePharmacyId = getActivePharmacyId();
    return {
      href: activePharmacyId
        ? "/app/pharmacies/" + activePharmacyId + "/dashboard"
        : "/app/select-pharmacy",
      label: "Retour au tableau de bord",
    };
  };

  const primaryAction = getPrimaryAction();

  function goBack() {
    window.history.back();
  }

  return (
    <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:flex-row">
      <LinkButton href={primaryAction.href} className="w-full sm:w-auto">
        {primaryAction.label}
      </LinkButton>
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={goBack}
      >
        Retour à la page précédente
      </Button>
    </div>
  );
}
