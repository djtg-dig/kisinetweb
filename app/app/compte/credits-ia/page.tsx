"use client";

import { FormEvent, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getCreditPacks,
  getMyCreditLedger,
  getMyCreditPurchases,
  getMyCreditWallet,
  createCreditPurchase,
  type CreditLedgerEntry,
  type CreditPack,
  type CreditPurchase,
  type CreditWallet,
} from "@/lib/api/billing";
import { getUserPharmacies, type PharmacySummary } from "@/lib/api";
import { getCreditLedgerDisplay } from "@/lib/credit-ledger-display";

const PAWAPAY_OPERATORS = ["AIRTEL_COD", "ORANGE_COD", "VODACOM_MPESA_COD"] as const;
const pawapayEnabled = process.env.NEXT_PUBLIC_PAWAPAY_ENABLED === "true";
const optgatewayEnabled = process.env.NEXT_PUBLIC_OPTGATEWAY_ENABLED === "true";

export default function PersonalAiCreditsPage() {
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacySummary[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [selectedPack, setSelectedPack] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [operator, setOperator] = useState<(typeof PAWAPAY_OPERATORS)[number]>("AIRTEL_COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMyCreditWallet(), getCreditPacks(), getMyCreditPurchases(), getMyCreditLedger(), getUserPharmacies()])
      .then(([currentWallet, currentPacks, currentPurchases, currentLedger, currentPharmacies]) => {
        setWallet(currentWallet);
        setPacks(currentPacks.filter((pack) => pack.isActive));
        setPurchases(currentPurchases);
        setLedger(currentLedger);
        setPharmacies(currentPharmacies);
        setSelectedPharmacy(currentPharmacies[0]?.id ?? "");
        setSelectedPack(String(currentPacks.find((pack) => pack.isActive)?.id ?? ""));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Impossible de charger vos crédits."));
  }, []);

  async function submitPawaPayPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !selectedPharmacy || !selectedPack) return;
    setIsSubmitting(true);
    setPaymentMessage("");
    try {
      const initiated = await createCreditPurchase(selectedPharmacy, {
        packId: Number(selectedPack), providerCode: "PAWAPAY", country: "CD", phoneNumber, operator,
      });
      if (!("paymentReference" in initiated)) {
        throw new Error("Réponse d'initiation pawaPay inattendue.");
      }
      setPaymentMessage(`Demande ${initiated.paymentReference} en attente (${initiated.status}). Confirmez sur votre téléphone. Vos crédits apparaîtront seulement après confirmation du backend.`);
    } catch (reason) {
      setPaymentMessage(reason instanceof Error ? reason.message : "Impossible d'initier l'achat.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitOPTGatewayPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !selectedPharmacy || !selectedPack) return;
    setIsSubmitting(true);
    setPaymentMessage("");
    try {
      const initiated = await createCreditPurchase(selectedPharmacy, {
        packId: Number(selectedPack), providerCode: "OPTGATEWAY", country: "CD",
      });
      if (!("paymentReference" in initiated) || !initiated.checkoutUrl) {
        throw new Error("La session de paiement sécurisée est indisponible. Réessayez plus tard.");
      }
      window.location.assign(initiated.checkoutUrl);
    } catch (reason) {
      setPaymentMessage(reason instanceof Error ? reason.message : "Impossible d'initier l'achat.");
      setIsSubmitting(false);
    }
  }

  return (
    <MainLayout>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <LinkButton href="/app/compte" variant="secondary">Retour au compte</LinkButton>
        <h1 className="mt-6 text-3xl font-bold text-app-text">Mes crédits IA</h1>
        <p className="mt-2 text-sm text-app-muted">Votre portefeuille est personnel et utilisable dans vos pharmacies autorisées.</p>
        {error && <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!wallet && !error && <LoadingBubble label="Chargement de vos crédits" className="mt-8 min-h-[160px]" />}
        {wallet && <>
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card label="Solde disponible" value={wallet.balance.toLocaleString("fr-FR")} />
            <Card label="Crédits achetés" value={wallet.purchasedTotal.toLocaleString("fr-FR")} />
            <Card label="Crédits consommés" value={wallet.consumedTotal.toLocaleString("fr-FR")} />
          </section>
          <section className="mt-6 rounded-lg border border-app-border bg-app-card p-5">
            <h2 className="text-lg font-bold text-app-text">Packs disponibles</h2>
            <p className="mt-2 text-sm text-app-muted">Les crédits sont personnels. La pharmacie sélectionnée sert uniquement à vérifier votre autorisation d'initier l'achat.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{packs.map((pack) => <article key={pack.id} className="rounded-md border border-app-border p-4"><p className="font-semibold text-app-text">{pack.name}</p><p className="mt-1 text-sm text-app-muted">{pack.creditAmount.toLocaleString("fr-FR")} crédits — {pack.price}</p></article>)}</div>
            {pawapayEnabled && <form className="mt-6 grid gap-4 border-t border-app-border pt-5" onSubmit={submitPawaPayPurchase}>
              <h3 className="font-semibold text-app-text">Acheter par Mobile Money</h3>
              <label className="text-sm text-app-text">Pharmacie autorisée<select required value={selectedPharmacy} onChange={(event) => setSelectedPharmacy(event.target.value)} className="mt-1 block w-full rounded border border-app-border bg-app-card p-2"><option value="">Sélectionnez une pharmacie</option>{pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}</select></label>
              <label className="text-sm text-app-text">Pack<select required value={selectedPack} onChange={(event) => setSelectedPack(event.target.value)} className="mt-1 block w-full rounded border border-app-border bg-app-card p-2">{packs.map((pack) => <option key={pack.id} value={pack.id}>{pack.name} — {pack.creditAmount} crédits</option>)}</select></label>
              <label className="text-sm text-app-text">Opérateur<select value={operator} onChange={(event) => setOperator(event.target.value as typeof operator)} className="mt-1 block w-full rounded border border-app-border bg-app-card p-2">{PAWAPAY_OPERATORS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="text-sm text-app-text">Numéro Mobile Money<input required inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="mt-1 block w-full rounded border border-app-border bg-app-card p-2" placeholder="243…" /></label>
              <button type="submit" disabled={isSubmitting || !selectedPharmacy || !selectedPack} className="rounded bg-primary-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Initiation…" : "Payer par Mobile Money"}</button>
              {paymentMessage && <p className="text-sm text-app-muted" role="status">{paymentMessage}</p>}
            </form>}
            {optgatewayEnabled && <form className="mt-6 grid gap-4 border-t border-app-border pt-5" onSubmit={submitOPTGatewayPurchase}>
              <h3 className="font-semibold text-app-text">Payer avec OPTGateway</h3>
              <label className="text-sm text-app-text">Pharmacie autorisée<select required value={selectedPharmacy} onChange={(event) => setSelectedPharmacy(event.target.value)} className="mt-1 block w-full rounded border border-app-border bg-app-card p-2"><option value="">Sélectionnez une pharmacie</option>{pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}</select></label>
              <label className="text-sm text-app-text">Pack<select required value={selectedPack} onChange={(event) => setSelectedPack(event.target.value)} className="mt-1 block w-full rounded border border-app-border bg-app-card p-2">{packs.map((pack) => <option key={pack.id} value={pack.id}>{pack.name} — {pack.creditAmount} crédits</option>)}</select></label>
              <p className="text-sm text-app-muted">Vous choisirez votre moyen de paiement sur la page sécurisée. Les crédits seront ajoutés uniquement après confirmation du backend.</p>
              <button type="submit" disabled={isSubmitting || !selectedPharmacy || !selectedPack} className="rounded bg-primary-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Initiation…" : "Continuer vers OPTGateway"}</button>
              {paymentMessage && <p className="text-sm text-app-muted" role="status">{paymentMessage}</p>}
            </form>}
            {!pawapayEnabled && !optgatewayEnabled && <p className="mt-5 text-sm text-app-muted">Le paiement en ligne est indisponible dans cet environnement.</p>}
          </section>
          <History title="Achats" empty="Aucun achat confirmé." rows={purchases.map((purchase) => `${purchase.credits} crédits — ${purchase.amount}`)} />
          <LedgerHistory entries={ledger} />
        </>}
      </main>
    </MainLayout>
  );
}

function Card({ label, value }: { label: string; value: string }) { return <article className="rounded-lg border border-app-border bg-app-card p-5"><p className="text-sm text-app-muted">{label}</p><p className="mt-2 text-2xl font-bold text-primary-700">{value}</p></article>; }
function History({ title, empty, rows }: { title: string; empty: string; rows: string[] }) { return <section className="mt-6 rounded-lg border border-app-border bg-app-card p-5"><h2 className="text-lg font-bold text-app-text">{title}</h2>{rows.length ? <ul className="mt-3 space-y-2 text-sm text-app-muted">{rows.map((row, index) => <li key={index}>{row}</li>)}</ul> : <p className="mt-3 text-sm text-app-muted">{empty}</p>}</section>; }
function LedgerHistory({ entries }: { entries: CreditLedgerEntry[] }) {
  return <section className="mt-6 rounded-lg border border-app-border bg-app-card p-5"><h2 className="text-lg font-bold text-app-text">Mouvements</h2>{entries.length ? <ul className="mt-3 space-y-3">{entries.map((entry) => { const movement = getCreditLedgerDisplay(entry); return <li key={entry.id} className="flex items-start justify-between gap-4 border-b border-app-border pb-3 last:border-0"><div><p className="font-medium text-app-text">{movement.title}</p><p className="mt-1 text-sm text-app-muted">{movement.description}</p></div><p className={movement.direction === "credit" ? "font-semibold text-green-700" : movement.direction === "debit" ? "font-semibold text-red-700" : "font-semibold text-app-muted"}>{movement.amount}</p></li>; })}</ul> : <p className="mt-3 text-sm text-app-muted">Aucun mouvement.</p>}</section>;
}
