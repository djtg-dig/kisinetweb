"use client";

import { useEffect } from "react";
import { refreshSalesChoices } from "@/lib/api/sales-choices";

export function SalesChoicesBootstrap() {
  useEffect(() => {
    let isMounted = true;

    async function loadChoices() {
      try {
        await refreshSalesChoices();
      } catch (error) {
        // Ces listes sont du confort frontend : une erreur ne doit pas bloquer l'application.
        if (isMounted) {
          console.warn("Impossible de mettre à jour les options de vente.", error);
        }
      }
    }

    loadChoices();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
