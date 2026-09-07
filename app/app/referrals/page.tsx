"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ApiAuthError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { WithdrawalDialog, withdrawalStatusLabel } from "@/components/referrals/WithdrawalDialog";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import { formatAmount, formatPercent } from "@/lib/referrals/withdrawal-format";
import { maskPhoneNumber } from "@/lib/referrals/withdrawal-display";
import {
  createReferralWithdrawal,
  getReferralPayoutAccounts,
  getReferralCommissions,
  getReferralOverview,
  getReferralWithdrawals,
  getReferredPharmacies,
  type ReferralCommission,
  type ReferralPayoutAccount,
  type ReferralWalletSummary,
  type ReferralWithdrawal,
  type ReferredPharmacy,
} from "@/lib/api/referrals";

type PageState = "loading" | "anonymous" | "ready" | "error";

async function fetchReferralDashboard() {
  const [overview, commissionList, withdrawalList, referredList, payoutAccountList] = await Promise.all([
    getReferralOverview(),
    getReferralCommissions(),
    getReferralWithdrawals(),
    getReferredPharmacies(),
    getReferralPayoutAccounts(),
  ]);

  return {
    overview,
    commissionList,
    withdrawalList,
    referredList,
    payoutAccountList,
  };
}

export default function ReferralsPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  // `messageKind` permet de styler différemment succès/erreur dans la
  // carte de retrait sans réécrire le composant.
  const [messageKind, setMessageKind] = useState<"info" | "success" | "error">("info");
  const [wallets, setWallets] = useState<ReferralWalletSummary[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [withdrawals, setWithdrawals] = useState<ReferralWithdrawal[]>([]);
  const [pharmacies, setPharmacies] = useState<ReferredPharmacy[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<ReferralPayoutAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  // `lastWithdrawalRef` stocke la référence du dernier retrait créé
  // pour afficher un message de confirmation dans la carte récapitulative.
  const [lastWithdrawalRef, setLastWithdrawalRef] = useState<string | null>(null);
  // `lastWithdrawalStatus` permet d'adapter le message ("Traitement en
  // cours" si PROCESSING, etc.).
  const [lastWithdrawalStatus, setLastWithdrawalStatus] = useState<string | null>(null);

  function applyReferralDashboard({
    overview,
    commissionList,
    withdrawalList,
    referredList,
    payoutAccountList,
  }: Awaited<ReturnType<typeof fetchReferralDashboard>>) {
    setWallets(overview);
    setCommissions(commissionList);
    setWithdrawals(withdrawalList);
    setPharmacies(referredList);
    setPayoutAccounts(payoutAccountList);
    setPageState("ready");
  }

  async function reloadReferralDashboard() {
    setPageState("loading");
    setMessage("");

    try {
      applyReferralDashboard(await fetchReferralDashboard());
    } catch (error) {
      if (error instanceof ApiAuthError) {
        setPageState("anonymous");
        return;
      }
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
        if (error instanceof ApiAuthError) {
          // Session absente ou expirée : on bascule sur l'écran de
          // connexion plutôt que d'afficher un message technique.
          setPageState("anonymous");
          return;
        }
        const errorMessage = error instanceof Error ? error.message : "";
        setPageState("error");
        setMessage(errorMessage || "Le parrainage n'est pas disponible pour le moment.");
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeWallet = useMemo(
    () => wallets[0] || null,
    [wallets],
  );

  // Le bouton de retrait est désactivé dès que le solde disponible
  // ne couvre pas le minimum requis (incluant les frais). Le backend
  // reste la validation ultime : un clic forcé en dev sera de toute
  // façon refusé par l'API.
  const canWithdraw = useMemo(() => {
    if (!activeWallet) {
      return false;
    }
    const available = Number(activeWallet.available_balance);
    const minimumRequired = Number(activeWallet.minimum_required_balance);
    if (!Number.isFinite(available) || !Number.isFinite(minimumRequired)) {
      return false;
    }
    return available >= minimumRequired;
  }, [activeWallet]);

  async function handleWithdrawalSubmit(payload: {
    amount: string;
    country: string;
    phone_number: string;
    operator: string;
  }) {
    setIsSubmitting(true);
    setMessage("");
    setMessageKind("info");

    try {
      const created = await createReferralWithdrawal({
        amount: payload.amount,
        currency: activeWallet ? activeWallet.currency : "USD",
        country: payload.country,
        phone_number: payload.phone_number,
        operator: payload.operator,
      });
      setIsWithdrawalModalOpen(false);
      setLastWithdrawalRef(created.reference);
      setLastWithdrawalStatus(created.status);
      // On rafraîchit le dashboard pour récupérer le nouveau solde
      // disponible (available_balance a été décrémenté de
      // total_reserved_amount, pas de amount seul).
      applyReferralDashboard(await fetchReferralDashboard());
      // On choisit le ton du message en fonction du statut retourné :
      // REQUESTED / PROCESSING -> info, PAID -> success, FAILED -> error.
      const kind: "info" | "success" | "error" =
        created.status === "PAID"
          ? "success"
          : created.status === "FAILED" || created.status === "REJECTED"
            ? "error"
            : "info";
      setMessageKind(kind);
      const statusLabel = withdrawalStatusLabel(created.status);
      setMessage(
        created.status === "PROCESSING"
          ? `Votre retrait a été transmis. Référence : ${created.reference} — Retrait en cours de traitement.`
          : created.status === "REQUESTED"
            ? `Votre retrait a été transmis. Référence : ${created.reference} — Préparation en cours.`
            : `Votre retrait (${created.reference}) est : ${statusLabel}.`,
      );
    } catch (error) {
      setMessageKind("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de soumettre le retrait pour le moment. Veuillez réessayer.",
      );
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
              Suivez vos commissions, votre solde disponible et vos retraits.
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
                <p className="text-sm font-semibold text-primary-700">Retrait</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Retirer mes commissions</h2>

                {activeWallet && (
                  <p className="mt-3 text-sm text-app-muted">
                    Disponible :{" "}
                    <span className="font-semibold text-app-text">
                      {formatAmount(activeWallet.available_balance, activeWallet.currency)}
                    </span>
                  </p>
                )}

                <p className="mt-4 text-sm leading-6 text-app-muted">
                  Regroupez plusieurs commissions dans un seul retrait. Le payout est envoyé automatiquement au provider ; aucune approbation manuelle n'est nécessaire.
                </p>

                {message && (
                  <p
                    className={
                      "mt-5 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm " +
                      (messageKind === "success"
                        ? "text-emerald-700"
                        : messageKind === "error"
                          ? "text-red-700"
                          : "text-app-muted")
                    }
                  >
                    {message}
                  </p>
                )}

                {!canWithdraw && activeWallet && (
                  <p className="mt-4 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
                    Votre solde est insuffisant pour effectuer un retrait.
                  </p>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setMessageKind("info");
                    setLastWithdrawalRef(null);
                    setLastWithdrawalStatus(null);
                    setIsWithdrawalModalOpen(true);
                  }}
                  disabled={!canWithdraw}
                  className="mt-5 w-full"
                >
                  Retirer
                </Button>
              </section>
            </aside>
          </div>
        )}

        <WithdrawalDialog
          open={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          wallet={activeWallet}
          isSubmitting={isSubmitting}
          message={messageKind === "error" ? message : ""}
          onSubmit={handleWithdrawalSubmit}
        />

        {/* Référence du dernier retrait créé (utile aux tests/debug). */}
        {lastWithdrawalRef && pageState === "ready" && (
          <span data-testid="last-withdrawal-ref" className="sr-only">
            {lastWithdrawalRef}
          </span>
        )}
        {lastWithdrawalStatus && pageState === "ready" && (
          <span data-testid="last-withdrawal-status" className="sr-only">
            {lastWithdrawalStatus}
          </span>
        )}
      </section>
    </MainLayout>
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
            <WithdrawalRow key={withdrawal.reference} withdrawal={withdrawal} />
          ))
        ) : (
          <EmptyLine label="Aucun retrait." />
        )}
      </ListSection>

      <ListSection
        title="Pharmacies parrainées"
        className="flex-1"
        action={
          <LinkButton
            href="/app/referrals/pharmacies"
            className="whitespace-nowrap"
            variant="secondary"
          >
            Voir tout
          </LinkButton>
        }
      >
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

// Ligne d'historique d'un retrait avec affichage de la décomposition
// "Montant demandé / Frais / Total consommé" et masquage du numéro
// de téléphone pour respecter la confidentialité.
function WithdrawalRow({ withdrawal }: { withdrawal: ReferralWithdrawal }) {
  const snapshot = (withdrawal.destination_snapshot || {}) as {
    phone_number?: string;
    country?: string;
    operator?: string;
  };
  const feeAmount = withdrawal.fee_amount;
  const totalReserved = withdrawal.total_reserved_amount;
  const phoneLabel = snapshot.phone_number ? maskPhoneNumber(snapshot.phone_number) : "";

  return (
    <article className="py-3">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-app-text">{withdrawal.reference}</p>
          <p className="mt-1 text-sm text-app-muted">
            {withdrawalStatusLabel(withdrawal.status)}
            {snapshot.country ? " · " + snapshot.country : ""}
            {snapshot.operator ? " · " + snapshot.operator : ""}
            {phoneLabel ? " · " + phoneLabel : ""}
          </p>
        </div>
        <p className="text-sm font-bold text-app-text">
          {formatAmount(withdrawal.amount, withdrawal.currency)}
        </p>
      </header>
      {(feeAmount || totalReserved) && (
        <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-app-muted">
          <div>
            <dt className="font-semibold uppercase">Demandé</dt>
            <dd className="font-bold text-app-text">{formatAmount(withdrawal.amount, withdrawal.currency)}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase">Frais</dt>
            <dd className="font-bold text-app-text">
              {feeAmount ? formatAmount(feeAmount, withdrawal.currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase">Total consommé</dt>
            <dd className="font-bold text-app-text">
              {totalReserved ? formatAmount(totalReserved, withdrawal.currency) : "—"}
            </dd>
          </div>
        </dl>
      )}
    </article>
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

function ListSection({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`rounded-lg border border-app-border bg-app-card p-6 shadow-sm ${className || ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">{title}</h2>
        {action}
      </div>
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
