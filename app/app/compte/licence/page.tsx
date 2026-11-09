"use client";

import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { createOPTGatewayUserLicensePurchase, getUserLicensePlans, getUserLicensePurchases, type UserLicensePlan, type UserLicensePurchase } from "@/lib/api";

const optgatewayEnabled = process.env.NEXT_PUBLIC_OPTGATEWAY_ENABLED === "true";

export default function UserLicensePage() {
  const [plans, setPlans] = useState<UserLicensePlan[]>([]);
  const [purchases, setPurchases] = useState<UserLicensePurchase[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const submitting = useRef(false);

  async function refresh() {
    const [availablePlans, history] = await Promise.all([getUserLicensePlans(), getUserLicensePurchases()]);
    setPlans(availablePlans);
    setPurchases(history);
  }

  useEffect(() => {
    refresh().catch(() => setMessage("Impossible de charger vos licences.")).finally(() => setLoading(false));
  }, []);

  async function buy(plan: UserLicensePlan) {
    if (submitting.current || !optgatewayEnabled) return;
    submitting.current = true;
    setMessage("");
    try {
      const idempotencyKey = crypto.randomUUID();
      const purchase = await createOPTGatewayUserLicensePurchase(plan.code, idempotencyKey);
      if (!purchase.checkoutUrl) throw new Error("La session de paiement sécurisée est indisponible.");
      window.location.assign(purchase.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'initialiser l'achat.");
      submitting.current = false;
    }
  }

  return <MainLayout><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <LinkButton href="/app/compte" variant="secondary">Retour au compte</LinkButton>
    <h1 className="mt-6 text-3xl font-bold text-app-text">Ma licence utilisateur</h1>
    <p className="mt-2 text-sm leading-6 text-app-muted">Une licence est personnelle et permanente. Elle définit uniquement le nombre de pharmacies que vous pouvez créer ; elle ne remplace pas leur abonnement.</p>
    {loading && <LoadingBubble label="Chargement des licences" className="mt-8 min-h-[160px]" />}
    {message && <p role="status" className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</p>}
    {!loading && <section className="mt-6 grid gap-4 sm:grid-cols-2">{plans.map((plan) => <article key={plan.code} className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm"><h2 className="text-xl font-bold text-app-text">{plan.name}</h2><p className="mt-2 text-sm text-app-muted">{plan.isUnlimited ? "Pharmacies illimitées" : `${plan.maxPharmacies ?? 0} pharmacies`}</p><p className="mt-4 text-2xl font-bold text-primary-700">{plan.price} {plan.currency}</p><p className="mt-1 text-sm text-app-muted">Paiement unique — sans renouvellement périodique.</p><button type="button" onClick={() => buy(plan)} disabled={!optgatewayEnabled} className="mt-5 rounded bg-primary-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{optgatewayEnabled ? "Acheter avec OPTGateway" : "Paiement indisponible"}</button></article>)}</section>}
    {!loading && <section className="mt-8 rounded-lg border border-app-border bg-app-card p-5"><h2 className="text-lg font-bold text-app-text">Mes achats</h2>{purchases.length ? <ul className="mt-3 space-y-3 text-sm text-app-muted">{purchases.map((purchase) => <li key={purchase.reference} className="flex flex-wrap justify-between gap-2 border-b border-app-border pb-3 last:border-0"><span>{purchase.plan.name} — {purchase.amount} {purchase.currency}</span><strong className="text-app-text">{purchase.status}</strong></li>)}</ul> : <p className="mt-3 text-sm text-app-muted">Aucun achat de licence.</p>}<p className="mt-4 text-sm text-app-muted">Après le retour de paiement, rechargez cette page : seul le statut confirmé par le backend active la licence.</p></section>}
  </main></MainLayout>;
}
