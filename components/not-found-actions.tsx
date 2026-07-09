"use client";

import { useEffect, useState } from "react";
import { getAccessToken, getActivePharmacyId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

type PrimaryAction = {
  href: string;
  label: string;
};

export function NotFoundActions() {
  const [primaryAction, setPrimaryAction] = useState<PrimaryAction>({
    href: "/",
    label: "Retour à l'accueil",
  });

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    const activePharmacyId = getActivePharmacyId();
    setPrimaryAction({
      href: activePharmacyId
        ? "/app/pharmacies/" + activePharmacyId + "/dashboard"
        : "/app/select-pharmacy",
      label: "Retour au tableau de bord",
    });
  }, []);

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
