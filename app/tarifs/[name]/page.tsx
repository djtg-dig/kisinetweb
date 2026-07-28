"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { CurrentSubscriptionCard } from "@/components/pricing/current-subscription-card";
import { PlanElements } from "@/components/pricing/plan-elements";
import {
  getPharmacySubscriptionPayment,
  getPharmacyPlan,
  getUserPharmacies,
  initiateAgregateurSubscriptionCheckout,
  type PharmacySubscriptionPayment,
  type PharmacyPlan,
  type PharmacyPlanDuration,
  type PharmacySummary,
} from "@/lib/api";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import {
  getAccessToken,
  getActivePharmacyId,
  saveTokensFromUrlHash,
  setActivePharmacyId,
} from "@/lib/auth";

type PageState = "loading" | "error" | "ready";
type PharmacyState = "idle" | "unauthenticated" | "loading" | "error" | "empty" | "ready";
type PaymentState = "idle" | "starting" | "opening" | "paying" | "confirming" | "validated" | "error";

type CommitmentOption = {
  months: number;
  discountPercentage: number;
  totalAmount?: string;
  badge?: string;
};

const fallbackCommitmentOptions: CommitmentOption[] = [
  { months: 1, discountPercentage: 0 },
];

const temporarySubscription = {
  planName: "Basic",
  expiresAt: "10 août 2026",
};

export default function PlanDetailPage() {
  const params = useParams<{ name?: string }>();
  const routePlanName = typeof params.name === "string" ? params.name : "";
  const [planName, setPlanName] = useState("");
  const [state, setState] = useState<PageState>("loading");
  const [pharmacyState, setPharmacyState] = useState<PharmacyState>("idle");
  const [plan, setPlan] = useState<PharmacyPlan | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacySummary[]>([]);
  const [selectedDurationMonths, setSelectedDurationMonths] = useState(12);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pharmacyErrorMessage, setPharmacyErrorMessage] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [activePayment, setActivePayment] = useState<PharmacySubscriptionPayment | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPlan() {
      const name = decodeURIComponent(routePlanName);

      if (!isMounted) {
        return;
      }

      setPlanName(name);
      setState("loading");
      setErrorMessage("");

      try {
        const pharmacyPlan = await getPharmacyPlan(name);
        if (!isMounted) {
          return;
        }

        setPlan(pharmacyPlan);
        setState("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Une erreur inconnue est survenue.");
        setState("error");
      }
    }

    loadPlan();

    return () => {
      isMounted = false;
    };
  }, [routePlanName]);

  useEffect(() => {
    let isMounted = true;

    async function loadPharmacies() {
      saveTokensFromUrlHash();

      if (!getAccessToken()) {
        setPharmacyState("unauthenticated");
        return;
      }

      setPharmacyState("loading");
      setPharmacyErrorMessage("");

      try {
        const rows = await getUserPharmacies();
        if (!isMounted) {
          return;
        }

        const manageablePharmacies = rows.filter(canManageSubscription);
        const lastPharmacyId = getActivePharmacyId();
        const preselectedPharmacy =
          manageablePharmacies.find((pharmacy) => pharmacy.id === lastPharmacyId) ||
          manageablePharmacies[0];

        setPharmacies(manageablePharmacies);
        setSelectedPharmacyId(preselectedPharmacy?.id || "");
        setPharmacyState(manageablePharmacies.length ? "ready" : "empty");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "";
        setPharmacyErrorMessage(message || "Impossible de charger vos pharmacies.");
        setPharmacyState("error");
      }
    }

    loadPharmacies();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPharmacy =
    pharmacies.find((pharmacy) => pharmacy.id === selectedPharmacyId) || null;
  const commitmentOptions = useMemo(
    () => buildCommitmentOptions(plan?.durations),
    [plan?.durations],
  );
  const selectedCommitment =
    commitmentOptions.find((option) => option.months === selectedDurationMonths) ||
    commitmentOptions.find((option) => option.months === 12) ||
    commitmentOptions[0];
  const orderSummary = useMemo(
    () => buildOrderSummary(plan, selectedCommitment),
    [plan, selectedCommitment],
  );
  const currentPlanPath = planName ? "/tarifs/" + encodeURIComponent(planName) : "/tarifs";
  const createPharmacyHref =
    "/app/pharmacies/create?return_to=" + encodeURIComponent(currentPlanPath);
  const loginHref = buildLoginHref(currentPlanPath);

  function selectPharmacy(pharmacyId: string) {
    setSelectedPharmacyId(pharmacyId);
    setActivePharmacyId(pharmacyId);
  }

  useEffect(() => {
    if (!checkoutUrl) {
      return;
    }

    function handleAgregateurMessage(event: MessageEvent) {
      const legacyPrefix = "ikee" + "pay";
      const message = String(event.data || "");

      if (message === "agregateur-ready" || message === legacyPrefix + "-ready") {
        setPaymentState("paying");
        setPaymentMessage("");
      }

      if (message === "agregateur-close" || message === legacyPrefix + "-close") {
        closeAgregateurCheckout();
      }

      if (message === "agregateur-success" || message === legacyPrefix + "-success") {
        const payment = activePayment;
        const pharmacyReference = selectedPharmacy?.reference || selectedPharmacy?.id || "";
        closeAgregateurCheckout();
        setPaymentState("confirming");
        setPaymentMessage("Paiement reçu. Confirmation serveur en cours...");
        if (payment && pharmacyReference) {
          void pollPaymentConfirmation(payment.id, pharmacyReference);
        }
      }
    }

    window.addEventListener("message", handleAgregateurMessage);
    return () => window.removeEventListener("message", handleAgregateurMessage);
  }, [activePayment, checkoutUrl, selectedPharmacy]);

  function closeAgregateurCheckout() {
    setCheckoutUrl("");
    if (paymentState === "opening" || paymentState === "paying") {
      setPaymentState("idle");
    }
  }

  async function pollPaymentConfirmation(paymentId: number, pharmacyReference: string) {
    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (attempt > 0) {
          await wait(3000);
        }

        const payment = await getPharmacySubscriptionPayment(paymentId, pharmacyReference);
        setActivePayment(payment);
        if (payment.status === "VALIDATED") {
          setPaymentState("validated");
          setPaymentMessage("Paiement confirmé. Votre abonnement est actif.");
          return;
        }
      }

      setPaymentState("confirming");
      setPaymentMessage(
        "Le paiement est encore en cours de confirmation. Vous pouvez vérifier le statut dans quelques instants.",
      );
    } catch (error) {
      setPaymentState("error");
      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "Impossible de vérifier la confirmation du paiement.",
      );
    }
  }

  async function handleStartPayment() {
    if (!plan || !selectedPharmacy) {
      return;
    }

    setPaymentState("starting");
    setPaymentMessage("");

    try {
      const checkout = await initiateAgregateurSubscriptionCheckout({
        pharmacyReference: selectedPharmacy.reference || selectedPharmacy.id,
        planCode: plan.code,
        durationMonths: selectedCommitment.months,
        currency: plan.currency || "USD",
      });
      setActivePayment(checkout.payment);
      setCheckoutUrl(checkout.checkoutUrl);
      setPaymentState("opening");
      setPaymentMessage("Ouverture du paiement sécurisé...");
    } catch (error) {
      setPaymentState("error");
      setPaymentMessage(
        error instanceof Error ? error.message : "Impossible de démarrer le paiement.",
      );
    }
  }

  return (
    <PublicLayout activePharmacy={selectedPharmacy}>
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-app-surface to-app-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary-200/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <LinkButton href="/tarifs" variant="secondary" className="mb-8">
              Retour
            </LinkButton>

            {state === "loading" && <LoadingBubble label="Chargement du plan" />}

            {state === "error" && (
              <div className="rounded-lg border border-red-200 bg-app-card p-8 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500 ring-1 ring-red-100">
                  !
                </span>
                <h1 className="mt-4 text-xl font-bold text-app-text">
                  Impossible de charger le plan
                </h1>
                <p className="mt-2 text-sm leading-6 text-app-muted">{errorMessage}</p>
                <LinkButton href="/tarifs" variant="secondary" className="mx-auto mt-6 w-fit">
                  Retour aux tarifs
                </LinkButton>
              </div>
            )}

            {state === "ready" && plan && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-6">
                  <PlanDetailsCard plan={plan} />
                  <CommitmentSelector
                    currency={plan.currency}
                    options={commitmentOptions}
                    plan={plan}
                    selectedMonths={selectedDurationMonths}
                    onSelect={setSelectedDurationMonths}
                  />
                  <PharmacySubscriptionSection
                    createPharmacyHref={createPharmacyHref}
                    loginHref={loginHref}
                    pharmacies={pharmacies}
                    pharmacyErrorMessage={pharmacyErrorMessage}
                    pharmacyState={pharmacyState}
                    selectedPharmacyId={selectedPharmacyId}
                    onSelectPharmacy={selectPharmacy}
                  />
                </div>

                <aside className="grid gap-6 lg:sticky lg:top-28 lg:self-start">
                  <CurrentSubscriptionCard
                    // Une future API remplacera ces donnees temporaires.
                    planName={temporarySubscription.planName}
                    expiresAt={temporarySubscription.expiresAt}
                  />
                  <OrderSummary
                    analysisCredits={plan.analysisCredits}
                    currency={plan.currency}
                    durationMonths={selectedCommitment.months}
                    monthlyPrice={orderSummary.monthlyPrice}
                    discountAmount={orderSummary.discountAmount}
                    discountPercentage={selectedCommitment.discountPercentage}
                    planName={plan.name}
                    selectedPharmacy={selectedPharmacy}
                    totalAmount={orderSummary.totalAmount}
                    onContinue={handleStartPayment}
                    disabled={
                      pharmacyState !== "ready" ||
                      !selectedPharmacy ||
                      paymentState === "starting" ||
                      paymentState === "opening" ||
                      paymentState === "paying" ||
                      paymentState === "confirming"
                    }
                    paymentMessage={paymentMessage}
                    paymentState={paymentState}
                  />
                </aside>
              </div>
            )}
          </div>
        </section>
        {checkoutUrl && (
          <AgregateurCheckoutModal
            checkoutUrl={checkoutUrl}
            onClose={closeAgregateurCheckout}
          />
        )}
      </main>
    </PublicLayout>
  );
}

function PlanDetailsCard({ plan }: { plan: PharmacyPlan }) {
  return (
    <article className="rounded-lg border border-app-border bg-app-card p-5 shadow-soft sm:p-7">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold ${
            plan.highlighted
              ? "bg-primary-600 text-white"
              : "bg-primary-50 text-primary-700 ring-1 ring-primary-100"
          }`}
        >
          {plan.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-app-text sm:text-3xl">{plan.name}</h1>
          <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
            {plan.code}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-app-muted sm:text-base">
        {plan.description}
      </p>

      <div className="mt-6 border-t border-app-border pt-6">
        <p className="flex flex-wrap items-baseline gap-1 text-4xl font-bold text-app-text">
          {plan.priceMonthly ? (
            <>
              {formatAmount(parseAmount(plan.priceMonthly))}
              {plan.currency ? (
                <span className="text-lg font-medium text-app-muted">{plan.currency}</span>
              ) : null}
              <span className="text-base font-medium text-app-muted"> / mois</span>
            </>
          ) : (
            "Prix à définir"
          )}
        </p>
      </div>

      <PlanElements plan={plan} />
    </article>
  );
}

function CommitmentSelector({
  currency,
  options,
  plan,
  selectedMonths,
  onSelect,
}: {
  currency?: string;
  options: CommitmentOption[];
  plan: PharmacyPlan;
  selectedMonths: number;
  onSelect: (months: number) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-app-muted">
          Engagement
        </p>
        <h2 className="mt-2 text-xl font-bold text-app-text">
          Choisissez votre durée
        </h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => {
          const summary = buildOrderSummary(plan, option);
          const isSelected = option.months === selectedMonths;

          return (
            <button
              key={option.months}
              type="button"
              onClick={() => onSelect(option.months)}
              className={`relative rounded-lg border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-100 ${
                isSelected
                  ? "border-primary-600 bg-primary-50 ring-1 ring-primary-200"
                  : "border-app-border bg-app-background/60 hover:border-primary-200"
              }`}
            >
              {option.badge && (
                <span className="mb-3 inline-flex rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                  {option.badge}
                </span>
              )}
              <span className="block text-lg font-bold text-app-text">
                {option.months} {option.months === 1 ? "mois" : "mois"}
              </span>
              <span className="mt-3 block text-2xl font-bold text-app-text">
                {formatMoney(summary.totalAmount, currency)}
              </span>
              <span className="mt-1 block text-sm font-medium text-app-muted">
                {formatMoney(summary.monthlyEquivalent, currency)} / mois
              </span>
              {option.discountPercentage > 0 && (
                <span className="mt-3 block text-sm font-semibold text-success-600">
                  Économie : {formatMoney(summary.discountAmount, currency)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PharmacySubscriptionSection({
  createPharmacyHref,
  loginHref,
  pharmacies,
  pharmacyErrorMessage,
  pharmacyState,
  selectedPharmacyId,
  onSelectPharmacy,
}: {
  createPharmacyHref: string;
  loginHref: string;
  pharmacies: PharmacySummary[];
  pharmacyErrorMessage: string;
  pharmacyState: PharmacyState;
  selectedPharmacyId: string;
  onSelectPharmacy: (pharmacyId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-wide text-app-muted">
        Pharmacie
      </p>
      <h2 className="mt-2 text-xl font-bold text-app-text">
        Choisissez la pharmacie à abonner
      </h2>

      {pharmacyState === "unauthenticated" && (
        <div className="mt-5 rounded-lg border border-app-border bg-app-background/60 p-5">
          <p className="text-sm font-semibold text-app-text">
            Vous devez être connecté pour souscrire à un abonnement.
          </p>
          <LinkButton href={loginHref} className="mt-4">
            Se connecter
          </LinkButton>
        </div>
      )}

      {pharmacyState === "loading" && (
        <div className="mt-5">
          <LoadingBubble label="Chargement de vos pharmacies" />
        </div>
      )}

      {pharmacyState === "error" && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            Impossible de charger vos pharmacies
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-red-700">
            {pharmacyErrorMessage}
          </p>
        </div>
      )}

      {pharmacyState === "empty" && (
        <div className="mt-5 rounded-lg border border-app-border bg-app-background/60 p-5">
          <p className="text-sm font-semibold text-app-text">
            Vous devez créer une pharmacie avant de souscrire à un abonnement.
          </p>
          <LinkButton href={createPharmacyHref} className="mt-4">
            Créer une pharmacie
          </LinkButton>
        </div>
      )}

      {pharmacyState === "ready" && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {pharmacies.map((pharmacy) => {
            const isSelected = pharmacy.id === selectedPharmacyId;

            return (
              <button
                key={pharmacy.id}
                type="button"
                onClick={() => onSelectPharmacy(pharmacy.id)}
                className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-100 ${
                  isSelected
                    ? "border-primary-600 bg-primary-50 ring-1 ring-primary-200"
                    : "border-app-border bg-app-background/60 hover:border-primary-200"
                }`}
              >
                <span className="block font-bold text-app-text">{pharmacy.name}</span>
                <span className="mt-2 block text-sm font-medium text-app-muted">
                  {formatRole(pharmacy.role)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OrderSummary({
  analysisCredits,
  currency,
  disabled,
  discountAmount,
  discountPercentage,
  durationMonths,
  monthlyPrice,
  onContinue,
  paymentMessage,
  paymentState,
  planName,
  selectedPharmacy,
  totalAmount,
}: {
  analysisCredits?: PharmacyPlan["analysisCredits"];
  currency?: string;
  disabled: boolean;
  discountAmount: number;
  discountPercentage: number;
  durationMonths: number;
  monthlyPrice: number;
  onContinue: () => void;
  paymentMessage: string;
  paymentState: PaymentState;
  planName: string;
  selectedPharmacy: PharmacySummary | null;
  totalAmount: number;
}) {
  const buttonLabel =
    paymentState === "starting" || paymentState === "opening"
      ? "Ouverture du paiement..."
      : paymentState === "paying"
        ? "Paiement en cours..."
        : paymentState === "confirming"
          ? "Confirmation serveur..."
          : "Continuer vers le paiement";

  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-soft">
      <h2 className="text-xl font-bold text-app-text">Résumé de la commande</h2>
      <div className="mt-5 grid gap-3 text-sm">
        <SummaryRow label="Pharmacie" value={selectedPharmacy?.name || "À sélectionner"} />
        <SummaryRow label="Plan" value={planName} />
        <SummaryRow label="Durée" value={durationMonths + " mois"} />
        {analysisCredits?.enabled && (
          <>
            <SummaryRow
              label="Crédits d'analyse par utilisateur"
              value={formatAnalysisCredits(
                analysisCredits.perUserMonthlyAnalysisCredits * durationMonths,
              )}
            />
            <SummaryRow
              label="Crédits d'analyse pharmacie"
              value={formatAnalysisCredits(
                analysisCredits.monthlyAnalysisCredits * durationMonths,
              )}
            />
          </>
        )}
        <SummaryRow label="Prix mensuel" value={formatMoney(monthlyPrice, currency)} />
        <SummaryRow
          label="Réduction"
          value={
            discountPercentage > 0
              ? discountPercentage + "% (" + formatMoney(discountAmount, currency) + ")"
              : "Aucune"
          }
        />
        <div className="mt-2 border-t border-app-border pt-4">
          <SummaryRow
            label="Montant total"
            value={formatMoney(totalAmount, currency)}
            strong
          />
        </div>
      </div>
      {paymentMessage && (
        <p
          className={`mt-5 rounded-md border px-4 py-3 text-sm leading-6 ${
            paymentState === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : paymentState === "validated"
                ? "border-success-200 bg-success-50 text-success-700"
                : "border-app-border bg-app-surface text-app-muted"
          }`}
        >
          {paymentMessage}
        </p>
      )}
      <Button
        type="button"
        className="mt-6 w-full"
        onClick={onContinue}
        disabled={disabled}
      >
        {buttonLabel}
      </Button>
    </section>
  );
}

function AgregateurCheckoutModal({
  checkoutUrl,
  onClose,
}: {
  checkoutUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-6">
      <div className="relative h-full w-full max-w-[450px] sm:h-[85vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-app-text shadow-sm transition hover:bg-red-50 hover:text-red-600 sm:-top-12 sm:right-0 sm:bg-transparent sm:text-white sm:shadow-none"
          aria-label="Fermer le paiement"
        >
          ×
        </button>
        <iframe
          title="Paiement sécurisé agrégateur"
          src={checkoutUrl}
          allow="payment"
          className="h-full w-full border-0 bg-transparent sm:rounded-[2rem]"
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-app-muted">{label}</span>
      <span
        className={`max-w-[60%] text-right ${
          strong ? "text-lg font-bold text-app-text" : "font-semibold text-app-text"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function buildOrderSummary(plan: PharmacyPlan | null, commitment: CommitmentOption) {
  const monthlyPrice = parseAmount(plan?.priceMonthly);
  const subtotal = monthlyPrice * commitment.months;
  const apiTotalAmount = parseAmount(commitment.totalAmount);
  const totalAmount =
    apiTotalAmount > 0
      ? apiTotalAmount
      : subtotal - subtotal * (commitment.discountPercentage / 100);
  const discountAmount = Math.max(0, subtotal - totalAmount);
  const monthlyEquivalent =
    commitment.months > 0 ? totalAmount / commitment.months : monthlyPrice;

  return {
    monthlyPrice,
    subtotal,
    discountAmount,
    totalAmount,
    monthlyEquivalent,
  };
}

function buildCommitmentOptions(durations?: PharmacyPlanDuration[]) {
  if (!durations?.length) {
    return fallbackCommitmentOptions;
  }

  return durations
    .filter((duration) => duration.durationMonths > 0)
    .map((duration) => ({
      months: duration.durationMonths,
      discountPercentage: duration.discountPercentage,
      totalAmount: duration.totalAmount,
      badge: duration.durationMonths === 12 ? "Le plus populaire" : undefined,
    }))
    .sort((first, second) => first.months - second.months);
}

function parseAmount(value?: string) {
  if (!value) {
    return 0;
  }

  const normalizedValue = value.replace(",", ".");
  const amount = Number(normalizedValue);

  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(amount: number, currency?: string) {
  const formattedAmount = formatAmount(amount);

  return currency ? formattedAmount + " " + currency : formattedAmount;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatAnalysisCredits(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function canManageSubscription(pharmacy: PharmacySummary) {
  const role = (pharmacy.role || "").toUpperCase();

  if (!role) {
    return true;
  }

  return ["OWNER", "PROPRIETAIRE", "PROPRIÉTAIRE", "ADMIN", "MANAGER", "GERANT", "GÉRANT"].includes(role);
}

function formatRole(role?: string) {
  const normalizedRole = (role || "").toUpperCase();

  if (!normalizedRole || normalizedRole === "OWNER") {
    return "Propriétaire";
  }

  if (normalizedRole === "MANAGER") {
    return "Membre gestionnaire";
  }

  return "Membre " + role;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function buildLoginHref(returnPath: string) {
  const separator = carriAccountLoginUrl.includes("?") ? "&" : "?";

  return carriAccountLoginUrl + separator + "next=" + encodeURIComponent(returnPath);
}
