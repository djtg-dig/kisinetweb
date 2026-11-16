"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type SubscriptionContext = "invoices" | "products" | "stock" | "members";

type SubscriptionInactiveStateProps = {
  context: SubscriptionContext;
  canPaySubscription: boolean;
  onPurchaseDenied: () => void;
  compact?: boolean;
};

const content: Record<SubscriptionContext, { subtitle: string; description: string }> = {
  invoices: {
    subtitle: "Factures indisponibles",
    description:
      "L'abonnement de cette pharmacie a expiré ou n'est pas actif. Un abonnement actif est nécessaire pour consulter et gérer les factures.",
  },
  products: {
    subtitle: "Produits indisponibles",
    description:
      "L'abonnement de cette pharmacie n'est plus actif. Renouvelez l'abonnement pour accéder à la gestion des produits.",
  },
  stock: {
    subtitle: "Stock indisponible",
    description:
      "L'abonnement de cette pharmacie a expiré ou n'est pas actif. Renouvelez l'abonnement pour consulter et gérer les mouvements de stock.",
  },
  members: {
    subtitle: "",
    description:
      "L'abonnement de cette pharmacie n'est pas actif. Un abonnement actif est nécessaire pour inviter de nouveaux collaborateurs.",
  },
};

export function SubscriptionInactiveState({
  context,
  canPaySubscription,
  onPurchaseDenied,
  compact = false,
}: SubscriptionInactiveStateProps) {
  const router = useRouter();
  const item = content[context];

  function goToPricing() {
    if (!canPaySubscription) {
      onPurchaseDenied();
      return;
    }

    router.push("/tarifs");
  }

  return (
    <section
      className={
        compact
          ? "rounded-lg border border-amber-200 bg-amber-50 p-4"
          : "max-w-2xl rounded-lg border border-amber-200 bg-app-card p-6 shadow-sm"
      }
    >
      <p className="text-sm font-semibold text-amber-700">Abonnement inactif</p>
      {item.subtitle && (
        <h2 className="mt-2 text-xl font-bold text-app-text">{item.subtitle}</h2>
      )}
      <p className="mt-2 text-sm leading-6 text-app-muted">{item.description}</p>
      <Button type="button" onClick={goToPricing} className="mt-5">
        Prendre un abonnement
      </Button>
    </section>
  );
}
