"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { WITHDRAWAL_COUNTRIES } from "@/lib/referrals/countries";
import { formatAmount } from "@/lib/referrals/withdrawal-format";
import type { ReferralWalletSummary } from "@/lib/api/referrals";
import {
  getReferralWithdrawalQuote,
  type MobileMoneyProvider,
  type ReferralWithdrawalQuote,
  type UserPaymentAccount,
} from "@/lib/api/user-payment-accounts";

export const REFERRAL_WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "En attente",
  PROCESSING: "En cours de traitement",
  PAID: "Payé",
  REJECTED: "Rejeté",
  FAILED: "Rejeté",
  CANCELLED: "Annulé",
};

export function withdrawalStatusLabel(status: string): string {
  return REFERRAL_WITHDRAWAL_STATUS_LABELS[status] || status;
}

type WithdrawalDialogProps = {
  open: boolean;
  onClose: () => void;
  wallet: ReferralWalletSummary | null;
  accounts: UserPaymentAccount[];
  providers: MobileMoneyProvider[];
  onConfirm: (input: { quoteToken: string; userPaymentAccountId: number }) => void;
  isSubmitting: boolean;
  message?: string;
};

export function WithdrawalDialog({
  open,
  onClose,
  wallet,
  accounts,
  providers,
  onConfirm,
  isSubmitting,
  message,
}: WithdrawalDialogProps) {
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.isActive && account.mobileMoneyProvider !== null),
    [accounts],
  );
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("CD");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [quote, setQuote] = useState<ReferralWithdrawalQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultAccount = activeAccounts.find((account) => account.isDefault) || activeAccounts[0];
    setAmount("");
    setCountry("CD");
    setAccountId(defaultAccount?.id || null);
    setQuote(null);
    setQuoteError("");
    setTouched(false);
  }, [open, activeAccounts]);

  if (!wallet) return null;

  const currentWallet = wallet;
  const amountNumber = Number(amount);
  const minAmount = Number(currentWallet.minimum_withdrawal_amount);
  const maxAmount = Number(currentWallet.max_withdrawable_amount);
  const selectedAccount = activeAccounts.find((account) => account.id === accountId) || null;
  const amountValid = Number.isFinite(amountNumber) && amountNumber >= minAmount && amountNumber <= maxAmount;
  const canRequestQuote = amountValid && selectedAccount !== null && !isQuoting;

  async function handleQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!canRequestQuote || !selectedAccount) return;

    setIsQuoting(true);
    setQuoteError("");
    try {
      setQuote(await getReferralWithdrawalQuote({
        amount: amountNumber.toFixed(2),
        currency: currentWallet.currency,
        country,
        userPaymentAccountId: selectedAccount.id,
      }));
    } catch (error) {
      setQuoteError(error instanceof Error ? error.message : "Impossible de préparer votre demande.");
    } finally {
      setIsQuoting(false);
    }
  }

  const provider = providers.find((item) => item.id === selectedAccount?.mobileMoneyProvider);

  return (
    <Modal open={open} title={quote ? "Confirmer ma demande" : "Demander un retrait"} onClose={onClose} saving={isSubmitting || isQuoting}>
      {quote ? (
        <section className="space-y-5">
          <p className="text-sm leading-6 text-app-muted">Votre demande sera transmise à Carri Business pour traitement. Vous serez informé lorsque le transfert sera effectué.</p>
          <WithdrawalSummary quote={quote} currency={wallet.currency} account={selectedAccount} provider={provider} />
          {message && <Alert message={message} />}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setQuote(null)} disabled={isSubmitting}>Modifier</Button>
            <Button type="button" disabled={isSubmitting || !selectedAccount} onClick={() => selectedAccount && onConfirm({ quoteToken: quote.quoteToken, userPaymentAccountId: selectedAccount.id })}>
              {isSubmitting ? "Enregistrement..." : "Confirmer ma demande"}
            </Button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleQuote} className="space-y-4">
          <section className="rounded-md border border-app-border bg-app-surface p-3 text-sm">
            <dl className="grid grid-cols-2 gap-3 text-app-text">
              <SummaryItem label="Solde disponible" value={formatAmount(wallet.available_balance, wallet.currency)} />
              <SummaryItem label="Limite minimale" value={formatAmount(wallet.minimum_withdrawal_amount, wallet.currency)} />
              <SummaryItem label="Limite maximale" value={formatAmount(wallet.max_withdrawable_amount, wallet.currency)} />
              <SummaryItem label="Frais" value="Déduits du montant demandé" />
            </dl>
          </section>

          {!activeAccounts.length ? (
            <section className="rounded-md border border-primary-200 bg-primary-50 p-4 text-sm leading-6 text-app-text">
              <p className="font-semibold">Aucun compte Mobile Money actif</p>
              <p className="mt-1 text-app-muted">Enregistrez un compte avant de demander le retrait de vos commissions.</p>
              <LinkButton href="/app/settings" className="mt-3" variant="secondary">Gérer mes comptes de retrait</LinkButton>
            </section>
          ) : (
            <>
              <label className="block text-sm font-semibold text-app-text">
                Montant à retirer ({wallet.currency})
                <input value={amount} onChange={(event) => setAmount(event.target.value)} onBlur={() => setTouched(true)} inputMode="decimal" required min={minAmount} max={maxAmount} step="0.01" placeholder={minAmount.toFixed(2)} className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
                {touched && !amountValid && <p className="mt-1 text-xs text-red-700">Respectez les limites de retrait affichées.</p>}
              </label>
              <label className="block text-sm font-semibold text-app-text">
                Pays de réception
                <select value={country} onChange={(event) => setCountry(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100">
                  {WITHDRAWAL_COUNTRIES.map((option) => <option key={option.iso2} value={option.iso2}>{option.iso2} — {option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-app-text">
                Compte Mobile Money
                <select value={accountId ?? ""} onChange={(event) => setAccountId(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100">
                  {activeAccounts.map((account) => {
                    const accountProvider = providers.find((item) => item.id === account.mobileMoneyProvider);
                    return <option key={account.id} value={account.id}>{accountProvider?.name || "Mobile Money"} — {account.accountIdentifierMasked}{account.isDefault ? " (par défaut)" : ""}</option>;
                  })}
                </select>
              </label>
              <LinkButton href="/app/settings" variant="secondary" className="w-full sm:w-auto">Gérer mes comptes de retrait</LinkButton>
            </>
          )}

          {quoteError && <Alert message={quoteError} />}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={!canRequestQuote || isSubmitting}>{isQuoting ? "Calcul des frais..." : "Voir le récapitulatif"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function WithdrawalSummary({ quote, currency, account, provider }: { quote: ReferralWithdrawalQuote; currency: string; account: UserPaymentAccount | null; provider?: MobileMoneyProvider }) {
  return <section className="rounded-md border border-app-border bg-app-surface p-4 text-sm"><dl className="grid gap-3 sm:grid-cols-2"><SummaryItem label="Montant débité" value={formatAmount(quote.totalDebited, currency)} /><SummaryItem label="Frais" value={formatAmount(quote.feeAmount, currency)} /><SummaryItem label="Montant net à recevoir" value={formatAmount(quote.netPayout, currency)} /><SummaryItem label="Devise" value={currency} /><SummaryItem label="Opérateur" value={provider?.name || "Mobile Money"} /><SummaryItem label="Numéro Mobile Money" value={account?.accountIdentifierMasked || "—"} /></dl><p className="mt-4 text-xs leading-5 text-app-muted">Les frais sont déduits du montant demandé. Ce récapitulatif provient du devis du backend.</p></section>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase text-app-muted">{label}</dt><dd className="mt-1 font-semibold text-app-text">{value}</dd></div>;
}

function Alert({ message }: { message: string }) {
  return <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">{message}</p>;
}
