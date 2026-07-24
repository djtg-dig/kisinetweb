"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import {
  createReferralWithdrawal,
  getReferralCommissions,
  getReferralOverview,
  getReferralWithdrawals,
  getReferredPharmacies,
  type ReferralCommission,
  type ReferralWalletSummary,
  type ReferralWithdrawal,
  type ReferredPharmacy,
} from "@/lib/api/referrals";

type PageState = "loading" | "anonymous" | "ready" | "error";

const defaultDestination = {
  operator: "",
  phone_number: "",
  account_name: "",
};

async function fetchReferralDashboard() {
  const [overview, commissionList, withdrawalList, referredList] = await Promise.all([
    getReferralOverview(),
    getReferralCommissions(),
    getReferralWithdrawals(),
    getReferredPharmacies(),
  ]);

  return {
    overview,
    commissionList,
    withdrawalList,
    referredList,
  };
}

export default function ReferralsPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [wallets, setWallets] = useState<ReferralWalletSummary[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [withdrawals, setWithdrawals] = useState<ReferralWithdrawal[]>([]);
  const [pharmacies, setPharmacies] = useState<ReferredPharmacy[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [destination, setDestination] = useState(defaultDestination);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  function applyReferralDashboard({
    overview,
    commissionList,
    withdrawalList,
    referredList,
  }: Awaited<ReturnType<typeof fetchReferralDashboard>>) {
    setWallets(overview);
    setCommissions(commissionList);
    setWithdrawals(withdrawalList);
    setPharmacies(referredList);
    setCurrency((current) => overview[0]?.currency || current);
    setPageState("ready");
  }

  async function reloadReferralDashboard() {
    setPageState("loading");
    setMessage("");

    try {
      applyReferralDashboard(await fetchReferralDashboard());
    } catch (error) {
      setPageState("error");
      setMessage(
        error instanceof Error ? error.message : "Le parrainage n'est pas disponible pour le moment.",
      );
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchReferralDashboard();
        if (isMounted) {
          applyReferralDashboard(data);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : "";
        if (errorMessage.toLowerCase().includes("session")) {
          setPageState("anonymous");
        } else {
          setPageState("error");
          setMessage(errorMessage || "Le parrainage n'est pas disponible pour le moment.");
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeWallet = useMemo(
    () => wallets.find((wallet) => wallet.currency === currency) || wallets[0] || null,
    [currency, wallets],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await createReferralWithdrawal({
        amount,
        currency,
        payment_method: paymentMethod,
        destination,
      });
      setAmount("");
      setDestination(defaultDestination);
      applyReferralDashboard(await fetchReferralDashboard());
      setIsWithdrawalModalOpen(false);
      setMessage("Demande de retrait enregistrée. Le montant est maintenant réservé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de créer le retrait.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MainLayout>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Compte</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Parrainage</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Suivez vos commissions, votre solde disponible et vos demandes de retrait.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {pageState === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement du parrainage" className="min-h-[220px]" />
          </section>
        )}

        {pageState === "anonymous" && <AnonymousState />}

        {pageState === "error" && (
          <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-700">Parrainage indisponible</p>
            <p className="mt-3 text-sm leading-6 text-app-muted">{message}</p>
            <Button onClick={() => void reloadReferralDashboard()} className="mt-5">
              Réessayer
            </Button>
          </section>
        )}

        {pageState === "ready" && (
          <>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-6">
              <WalletOverview wallets={wallets} />
              <ReferralTables
                commissions={commissions}
                withdrawals={withdrawals}
                pharmacies={pharmacies}
              />
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Retrait groupé</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Demander un retrait</h2>

                {activeWallet && (
                  <p className="mt-3 text-sm text-app-muted">
                    Disponible:{" "}
                    <span className="font-semibold text-app-text">
                      {activeWallet.available_balance} {activeWallet.currency}
                    </span>
                  </p>
                )}

                <p className="mt-4 text-sm leading-6 text-app-muted">
                  Regroupez plusieurs commissions dans une seule demande pour réduire les frais de retrait.
                </p>

                {message && (
                  <p className="mt-5 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
                    {message}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setIsWithdrawalModalOpen(true);
                  }}
                  className="mt-5 w-full"
                >
                  Demander un retrait
                </Button>
              </section>
            </aside>
          </div>
          {isWithdrawalModalOpen && (
            <WithdrawalRequestDialog
              activeWallet={activeWallet}
              amount={amount}
              currency={currency}
              destination={destination}
              isSubmitting={isSubmitting}
              message={message}
              paymentMethod={paymentMethod}
              wallets={wallets}
              onAmountChange={setAmount}
              onClose={() => setIsWithdrawalModalOpen(false)}
              onCurrencyChange={setCurrency}
              onDestinationChange={setDestination}
              onPaymentMethodChange={setPaymentMethod}
              onSubmit={handleSubmit}
            />
          )}
          </>
        )}
      </section>
    </MainLayout>
  );
}

function WithdrawalRequestDialog({
  activeWallet,
  amount,
  currency,
  destination,
  isSubmitting,
  message,
  paymentMethod,
  wallets,
  onAmountChange,
  onClose,
  onCurrencyChange,
  onDestinationChange,
  onPaymentMethodChange,
  onSubmit,
}: {
  activeWallet: ReferralWalletSummary | null;
  amount: string;
  currency: string;
  destination: typeof defaultDestination;
  isSubmitting: boolean;
  message: string;
  paymentMethod: string;
  wallets: ReferralWalletSummary[];
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onCurrencyChange: (value: string) => void;
  onDestinationChange: (value: typeof defaultDestination) => void;
  onPaymentMethodChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-stretch justify-center bg-black/40 px-3 pb-3 pt-20 sm:items-center sm:px-4 sm:py-6 sm:pt-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-dialog-title"
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-app-border bg-app-card shadow-soft"
      >
        <div className="flex items-start justify-between gap-4 border-b border-app-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-primary-700">Retrait groupé</p>
            <h2 id="withdrawal-dialog-title" className="mt-1 text-xl font-bold text-app-text">
              Demander un retrait
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-app-border bg-app-surface text-lg font-bold text-app-muted transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto px-5 py-5">
          {activeWallet && (
            <p className="mb-5 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
              Disponible:{" "}
              <span className="font-semibold text-app-text">
                {activeWallet.available_balance} {activeWallet.currency}
              </span>
            </p>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-app-text">
              Montant
              <input
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
                inputMode="decimal"
                required
                placeholder="15.00"
                className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            <label className="block text-sm font-semibold text-app-text">
              Devise
              <select
                value={currency}
                onChange={(event) => onCurrencyChange(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              >
                {(wallets.length ? wallets : [{ currency: "USD" } as ReferralWalletSummary]).map(
                  (wallet) => (
                    <option key={wallet.currency} value={wallet.currency}>
                      {wallet.currency}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block text-sm font-semibold text-app-text">
              Moyen
              <select
                value={paymentMethod}
                onChange={(event) => onPaymentMethodChange(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              >
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="IKEEPAY">iKeePay</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="OTHER">Autre</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-app-text">
              Opérateur
              <input
                value={destination.operator}
                onChange={(event) =>
                  onDestinationChange({ ...destination, operator: event.target.value })
                }
                placeholder="MPESA"
                className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            <label className="block text-sm font-semibold text-app-text">
              Téléphone
              <input
                value={destination.phone_number}
                onChange={(event) =>
                  onDestinationChange({ ...destination, phone_number: event.target.value })
                }
                placeholder="+243XXXXXXXXX"
                className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            <label className="block text-sm font-semibold text-app-text">
              Nom du bénéficiaire
              <input
                value={destination.account_name}
                onChange={(event) =>
                  onDestinationChange({ ...destination, account_name: event.target.value })
                }
                className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            {message && (
              <p className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
                {message}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Demander le retrait"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WalletOverview({ wallets }: { wallets: ReferralWalletSummary[] }) {
  if (!wallets.length) {
    return (
      <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Portefeuille</p>
        <h2 className="mt-2 text-xl font-bold text-app-text">Aucune commission disponible</h2>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          Les soldes apparaîtront ici après confirmation des abonnements payés par
          vos pharmacies parrainées.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {wallets.map((wallet) => (
        <article
          key={wallet.currency}
          className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary-700">{wallet.currency}</p>
              <h2 className="mt-1 text-2xl font-bold text-app-text">
                {wallet.available_balance}
              </h2>
            </div>
            <span className="rounded-md border border-app-border bg-app-surface px-3 py-1 text-xs font-semibold text-app-muted">
              {wallet.commissions_count} commissions
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Metric label="Gagné" value={wallet.earned_total} />
            <Metric label="En attente" value={wallet.pending_balance} />
            <Metric label="Réservé" value={wallet.reserved_balance} />
            <Metric label="Retiré" value={wallet.withdrawn_total} />
          </dl>
        </article>
      ))}
    </section>
  );
}

function ReferralTables({
  commissions,
  withdrawals,
  pharmacies,
}: {
  commissions: ReferralCommission[];
  withdrawals: ReferralWithdrawal[];
  pharmacies: ReferredPharmacy[];
}) {
  return (
    <div className="space-y-6">
      <ListSection title="Commissions récentes">
        {commissions.length ? (
          commissions.slice(0, 6).map((commission) => (
            <ListRow
              key={commission.id}
              title={commission.pharmacy_reference}
              meta={commission.status + " · " + commission.created_at}
              value={commission.commission_amount + " " + commission.currency}
            />
          ))
        ) : (
          <EmptyLine label="Aucune commission enregistrée." />
        )}
      </ListSection>

      <ListSection title="Retraits">
        {withdrawals.length ? (
          withdrawals.slice(0, 6).map((withdrawal) => (
            <ListRow
              key={withdrawal.reference}
              title={withdrawal.reference}
              meta={withdrawal.status + " · " + withdrawal.payment_method}
              value={withdrawal.amount + " " + withdrawal.currency}
            />
          ))
        ) : (
          <EmptyLine label="Aucune demande de retrait." />
        )}
      </ListSection>

      <ListSection title="Pharmacies parrainées">
        {pharmacies.length ? (
          pharmacies.slice(0, 6).map((pharmacy) => (
            <ListRow
              key={pharmacy.id}
              title={pharmacy.pharmacy_name}
              meta={pharmacy.pharmacy_reference + " · " + pharmacy.status}
              value={pharmacy.referral_code || "Code non renseigné"}
            />
          ))
        ) : (
          <EmptyLine label="Aucune pharmacie parrainée." />
        )}
      </ListSection>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface p-3">
      <dt className="text-xs font-semibold uppercase text-app-muted">{label}</dt>
      <dd className="mt-1 font-bold text-app-text">{value}</dd>
    </div>
  );
}

function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <h2 className="text-xl font-bold text-app-text">{title}</h2>
      <div className="mt-4 divide-y divide-app-border">{children}</div>
    </section>
  );
}

function ListRow({ title, meta, value }: { title: string; meta: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-app-text">{title}</p>
        <p className="mt-1 text-sm text-app-muted">{meta}</p>
      </div>
      <p className="text-sm font-bold text-app-text">{value}</p>
    </div>
  );
}

function EmptyLine({ label }: { label: string }) {
  return <p className="py-4 text-sm text-app-muted">{label}</p>;
}

function AnonymousState() {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Connexion requise</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Parrainage indisponible</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Connectez-vous avec Carri Account pour consulter vos commissions et vos retraits.
      </p>
      <LinkButton href={carriAccountLoginUrl} className="mt-5">
        Se connecter
      </LinkButton>
    </section>
  );
}
