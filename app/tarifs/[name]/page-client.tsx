"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { ToastMessage } from "@/components/ui/toast";
import { CurrentSubscriptionCard } from "@/components/pricing/current-subscription-card";
import { PlanElements } from "@/components/pricing/plan-elements";
import {
  SubscriptionConfirmation,
  type ConfirmationTotals,
} from "@/components/pricing/subscription-confirmation";
import {
  getPharmacySubscriptionPayment,
  getPharmacyPlan,
  getUserPharmacies,
  initiateAgregateurSubscriptionCheckout,
  type PharmacySubscriptionPayment,
  type PharmacyPlan,
  type PharmacyPlanDuration,
  type PharmacySummary,
  type SubscriptionPaymentProvider,
} from "@/lib/api";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import {
  getActivePharmacyId,
  setActivePharmacyId,
} from "@/lib/auth";
import { useSession } from "@/lib/hooks/use-session";

type PageState = "loading" | "error" | "ready";
type PharmacyState = "idle" | "unauthenticated" | "loading" | "error" | "empty" | "ready";
type PaymentState = "idle" | "starting" | "opening" | "paying" | "confirming" | "validated" | "error";
// Etape du parcours : selection des options puis confirmation avant paiement.
type CheckoutStep = "selection" | "confirmation";

const PAWAPAY_OPERATORS = [
  { value: "AIRTEL_COD", label: "Airtel Money" },
  { value: "ORANGE_COD", label: "Orange Money" },
  { value: "VODACOM_MPESA_COD", label: "Vodacom M-Pesa" },
] as const;

const pawapayAvailable = process.env.NEXT_PUBLIC_PAWAPAY_ENABLED === "true";
const optgatewayAvailable = process.env.NEXT_PUBLIC_OPTGATEWAY_ENABLED === "true";
const initialPaymentProvider: SubscriptionPaymentProvider = optgatewayAvailable
  ? "OPTGATEWAY"
  : "AGREGATEUR";

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
  const [toastMessage, setToastMessage] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<SubscriptionPaymentProvider>(initialPaymentProvider);
  const [pawapayPhoneNumber, setPawapayPhoneNumber] = useState("");
  const [pawapayOperator, setPawapayOperator] = useState("");
  const { authenticated, loading: sessionLoading } = useSession();

  // Nombre d'utilisateurs actifs a inclure dans l'abonnement (modele seat-based).
  const [step, setStep] = useState<CheckoutStep>("selection");
  // Verrou synchrone contre les doubles clics sur le bouton de paiement :
  // le state React est asynchrone et laisse passer deux clics rapproches.
  const isStartingPaymentRef = useRef(false);
  const isPollingPaymentRef = useRef(false);
  const pollingRunRef = useRef(0);

  useEffect(() => {
    return () => {
      pollingRunRef.current += 1;
      isPollingPaymentRef.current = false;
    };
  }, []);

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
      if (sessionLoading) {
        setPharmacyState("loading");
        return;
      }

      if (!authenticated) {
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
  }, [authenticated, sessionLoading]);

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

  // Verifications bloquantes avant la confirmation de la commande.
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!plan) {
      errors.push("Aucun plan n'est sélectionné.");
    }


    if (!selectedCommitment || selectedCommitment.months < 1) {
      errors.push("Aucune durée d'engagement n'est sélectionnée.");
    }

    if (!selectedPharmacy) {
      errors.push("Aucune pharmacie n'est sélectionnée pour cet abonnement.");
    } else if (!selectedPharmacy.reference && !selectedPharmacy.id) {
      errors.push("La référence de la pharmacie sélectionnée est introuvable.");
    }

    if (paymentProvider === "PAWAPAY") {
      if (!pawapayOperator) {
        errors.push("Sélectionnez votre opérateur Mobile Money.");
      }
      if (!/^\d{8,15}$/.test(pawapayPhoneNumber.replace(/\D/g, ""))) {
        errors.push("Saisissez un numéro Mobile Money international valide.");
      }
    }

    return errors;
  }, [pawapayOperator, pawapayPhoneNumber, paymentProvider, plan, selectedCommitment, selectedPharmacy]);

  const canConfirm = validationErrors.length === 0;
  const isPaymentBusy =
    paymentState === "starting" ||
    paymentState === "opening" ||
    paymentState === "paying" ||
    paymentState === "confirming";
  // Sans session connue, le bouton reste accessible pour expliquer la situation.
  // Une commande incomplète ne redevient bloquante qu'après authentification.
  const isContinueDisabled =
    isPaymentBusy || (!sessionLoading && authenticated && !canConfirm);

  // Le recapitulatif reprend les montants deja calcules : aucune nouvelle
  // logique metier n'est introduite ici.
  const confirmationTotals = useMemo<ConfirmationTotals>(() => {
    const unitPrice = parseAmount(plan?.priceMonthly ?? plan?.pricePerUserMonth);

    return {
      unitPrice,
      monthlyAmount: orderSummary.monthlyPrice,
      durationMonths: selectedCommitment?.months ?? 0,
      subtotal: orderSummary.subtotal,
      discountPercentage: selectedCommitment?.discountPercentage ?? 0,
      discountAmount: orderSummary.discountAmount,
      totalAmount: orderSummary.totalAmount,
    };
  }, [orderSummary, plan, selectedCommitment]);
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
  }

  async function pollPaymentConfirmation(paymentId: number, pharmacyReference: string) {
    if (isPollingPaymentRef.current) {
      return;
    }

    isPollingPaymentRef.current = true;
    const pollingRun = ++pollingRunRef.current;

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (attempt > 0) {
          await wait(3000);
        }

        if (pollingRun !== pollingRunRef.current) {
          return;
        }

        const payment = await getPharmacySubscriptionPayment(paymentId, pharmacyReference);
        if (pollingRun !== pollingRunRef.current) {
          return;
        }
        setActivePayment(payment);
        if (payment.status === "VALIDATED") {
          setCheckoutUrl("");
          setPaymentState("validated");
          setPaymentMessage("Paiement confirmé. Votre abonnement est actif.");
          return;
        }

        if (["CANCELED", "FAILED", "REFUNDED"].includes(payment.status)) {
          setCheckoutUrl("");
          setPaymentState("error");
          setPaymentMessage("Le paiement n'a pas été confirmé. Aucun abonnement n'a été activé.");
          return;
        }
      }

      setPaymentState("confirming");
      setPaymentMessage(
        "Le paiement est encore en cours de confirmation. Vous pouvez vérifier le statut dans quelques instants.",
      );
    } catch (error) {
      // Une erreur de lecture ne prouve pas l'échec du paiement. L'utilisateur
      // peut fermer l'iframe puis consulter son statut plus tard.
      setPaymentState("confirming");
      setPaymentMessage(
        error instanceof Error
          ? "Le statut du paiement reste à confirmer : " + error.message
          : "Le statut du paiement reste à confirmer. Réessayez dans quelques instants.",
      );
    } finally {
      if (pollingRun === pollingRunRef.current) {
        isPollingPaymentRef.current = false;
      }
    }
  }

  function goToConfirmation() {
    if (sessionLoading) {
      setToastMessage("Vérification de votre connexion en cours...");
      return;
    }

    if (!authenticated) {
      setToastMessage("Vous devez vous connecter à votre compte pour vérifier votre commande.");
      return;
    }

    if (!canConfirm) {
      return;
    }

    setPaymentMessage("");
    if (paymentState === "error") {
      setPaymentState("idle");
    }
    setStep("confirmation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToSelection() {
    setStep("selection");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleStartPayment() {
    if (!plan || !selectedPharmacy) {
      return;
    }

    // Garde-fou : on ne declenche jamais le paiement sur une commande invalide.
    if (!canConfirm) {
      return;
    }

    // Anti double-clic : une initiation deja en cours (ou un paiement confirme)
    // ne doit jamais creer un second paiement cote backend. La ref est lue et
    // ecrite de facon synchrone, contrairement au state React qui laisse
    // passer deux clics rapproches sur le meme rendu.
    if (isStartingPaymentRef.current || isPaymentBusy || paymentState === "validated") {
      return;
    }

    isStartingPaymentRef.current = true;
    setPaymentState("starting");
    setPaymentMessage("");

    // Le frontend n'envoie que les informations de la commande ; le backend
    // reste la seule source de verite pour le montant, les remises et les
    // credits IA inclus. Aucun montant n'est calcule ici.
    try {
      const checkout = await initiateAgregateurSubscriptionCheckout({
        pharmacyReference: selectedPharmacy.reference || selectedPharmacy.id,
        planCode: plan.code,
        planId: plan.id,
        durationMonths: selectedCommitment.months,
        currency: plan.currency || "USD",
        providerCode: paymentProvider,
        ...(paymentProvider === "PAWAPAY"
          ? {
              country: "CD",
              phoneNumber: pawapayPhoneNumber,
              operator: pawapayOperator,
            }
          : paymentProvider === "OPTGATEWAY"
            ? { country: "CD" }
          : {}),
      });
      setActivePayment(checkout.payment);
      if (paymentProvider === "PAWAPAY") {
        setPaymentState("confirming");
        setPaymentMessage(
          "Votre demande Mobile Money est prise en charge. Confirmez-la sur votre téléphone si votre opérateur vous le demande. Le statut reste en attente de confirmation serveur.",
        );
      } else if (paymentProvider === "OPTGATEWAY") {
        if (!checkout.checkoutUrl) {
          throw new Error("Le serveur n'a pas renvoyé de session OPTGateway.");
        }
        window.location.assign(checkout.checkoutUrl);
        return;
      } else {
        setCheckoutUrl(checkout.checkoutUrl);
        setPaymentState("opening");
        setPaymentMessage("Ouverture du paiement sécurisé...");
      }
      void pollPaymentConfirmation(
        checkout.payment.id,
        selectedPharmacy.reference || selectedPharmacy.id,
      );
    } catch (error) {
      // On affiche le message metier renvoye par le backend et on ne retombe
      // sur un message generique que s'il n'y en a aucun.
      const backendMessage = error instanceof Error ? error.message.trim() : "";
      setPaymentState("error");
      setPaymentMessage(backendMessage || "Impossible de démarrer le paiement.");
    } finally {
      isStartingPaymentRef.current = false;
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

            {state === "ready" && plan && step === "confirmation" && (
              <SubscriptionConfirmation
                currency={plan.currency}
                disabled={!canConfirm || isPaymentBusy || paymentState === "validated"}
                isSubmitting={isPaymentBusy}
                paymentMessage={paymentMessage}
                paymentTone={
                  paymentState === "error"
                    ? "error"
                    : paymentState === "validated"
                      ? "success"
                      : "neutral"
                }
                paymentProvider={paymentProvider}
                plan={plan}
                selectedPharmacy={selectedPharmacy}
                submitLabel={buildPaymentButtonLabel(paymentState)}
                totals={confirmationTotals}
                validationErrors={validationErrors}
                onBack={backToSelection}
                onConfirm={handleStartPayment}
              />
            )}

            {state === "ready" && plan && step === "selection" && (
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
                  <PaymentProviderSection
                    pawapayAvailable={pawapayAvailable}
                    optgatewayAvailable={optgatewayAvailable}
                    pawapayOperator={pawapayOperator}
                    pawapayPhoneNumber={pawapayPhoneNumber}
                    provider={paymentProvider}
                    onOperatorChange={setPawapayOperator}
                    onPhoneNumberChange={setPawapayPhoneNumber}
                    onProviderChange={setPaymentProvider}
                  />
                </div>

                <aside className="grid gap-6 lg:sticky lg:top-28 lg:self-start">
                  <CurrentSubscriptionCard
                    // Une future API remplacera ces donnees temporaires.
                    planName={temporarySubscription.planName}
                    expiresAt={temporarySubscription.expiresAt}
                  />
                  <OrderSummary
                    currency={plan.currency}
                    durationMonths={selectedCommitment.months}
                    monthlyPrice={orderSummary.monthlyPrice}
                    discountAmount={orderSummary.discountAmount}
                    discountPercentage={selectedCommitment.discountPercentage}
                    planName={plan.name}
                    selectedPharmacy={selectedPharmacy}
                    onContinue={goToConfirmation}
                    disabled={isContinueDisabled}
                    paymentMessage={paymentMessage}
                    paymentState={paymentState}
                    totalAmount={orderSummary.totalAmount}
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
        {toastMessage && (
          <ToastMessage
            tone="warning"
            duration={4000}
            onClose={() => setToastMessage("")}
          >
            {toastMessage}
          </ToastMessage>
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
          <p className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-app-muted">
            <span>{plan.code}</span>
            {typeof plan.version === "number" && (
              <span className="rounded-full bg-app-background px-2 py-0.5 text-[0.65rem] font-semibold text-app-muted ring-1 ring-app-border">
                v{plan.version}
              </span>
            )}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-app-muted sm:text-base">
        {plan.description}
      </p>

      <div className="mt-6 border-t border-app-border pt-6">
        <p className="flex flex-wrap items-baseline gap-1 text-4xl font-bold text-app-text">
          {plan.pricePerUserMonth || plan.priceMonthly ? (
            <>
              {formatAmount(parseAmount(plan.pricePerUserMonth || plan.priceMonthly))}
              {plan.currency ? (
                <span className="text-lg font-medium text-app-muted">{plan.currency}</span>
              ) : null}
              <span className="text-base font-medium text-app-muted">
                {" "}
                / mois / pharmacie
              </span>
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
          <LinkButton href={loginHref} className="mt-4" aria-label="Se connecter pour finaliser la souscription">
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

function PaymentProviderSection({
  pawapayAvailable,
  optgatewayAvailable,
  pawapayOperator,
  pawapayPhoneNumber,
  provider,
  onOperatorChange,
  onPhoneNumberChange,
  onProviderChange,
}: {
  pawapayAvailable: boolean;
  optgatewayAvailable: boolean;
  pawapayOperator: string;
  pawapayPhoneNumber: string;
  provider: SubscriptionPaymentProvider;
  onOperatorChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onProviderChange: (value: SubscriptionPaymentProvider) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-wide text-app-muted">Paiement</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Choisissez votre moyen de paiement</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onProviderChange("AGREGATEUR")}
          className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-100 ${
            provider === "AGREGATEUR"
              ? "border-primary-600 bg-primary-50 ring-1 ring-primary-200"
              : "border-app-border bg-app-background/60 hover:border-primary-200"
          }`}
        >
          <span className="block font-bold text-app-text">iKeePay</span>
          <span className="mt-1 block text-sm leading-5 text-app-muted">Paiement hébergé existant.</span>
        </button>
        {pawapayAvailable && (
          <button
            type="button"
            onClick={() => onProviderChange("PAWAPAY")}
            className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-100 ${
              provider === "PAWAPAY"
                ? "border-primary-600 bg-primary-50 ring-1 ring-primary-200"
                : "border-app-border bg-app-background/60 hover:border-primary-200"
            }`}
          >
            <span className="block font-bold text-app-text">pawaPay</span>
            <span className="mt-1 block text-sm leading-5 text-app-muted">Dépôt Mobile Money en RDC.</span>
          </button>
        )}
        {optgatewayAvailable && (
          <button
            type="button"
            onClick={() => onProviderChange("OPTGATEWAY")}
            className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-100 ${
              provider === "OPTGATEWAY"
                ? "border-primary-600 bg-primary-50 ring-1 ring-primary-200"
                : "border-app-border bg-app-background/60 hover:border-primary-200"
            }`}
          >
            <span className="block font-bold text-app-text">OPTGateway</span>
            <span className="mt-1 block text-sm leading-5 text-app-muted">Paiement hébergé sécurisé.</span>
          </button>
        )}
      </div>

      {provider === "PAWAPAY" && pawapayAvailable && (
        <div className="mt-5 grid gap-4 rounded-lg border border-app-border bg-app-background/60 p-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-app-text">
            Pays
            <input value="RDC (CD)" disabled className="h-11 rounded-md border border-app-border bg-app-surface px-3 text-app-muted" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-app-text">
            Opérateur
            <select value={pawapayOperator} onChange={(event) => onOperatorChange(event.target.value)} className="h-11 rounded-md border border-app-border bg-app-surface px-3 text-app-text focus:outline-none focus:ring-4 focus:ring-primary-100">
              <option value="">Sélectionnez un opérateur</option>
              {PAWAPAY_OPERATORS.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-app-text sm:col-span-2">
            Numéro Mobile Money
            <input value={pawapayPhoneNumber} onChange={(event) => onPhoneNumberChange(event.target.value.replace(/[^\d+\s()-]/g, ""))} inputMode="tel" autoComplete="tel" placeholder="Ex. +243 812 345 678" className="h-11 rounded-md border border-app-border bg-app-surface px-3 text-app-text outline-none focus:ring-4 focus:ring-primary-100" />
          </label>
          <p className="text-sm leading-6 text-app-muted sm:col-span-2">Le montant et la disponibilité sont confirmés par le backend. Une validation peut être demandée sur votre téléphone.</p>
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
  userCountError,
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
  userCountError?: string;
}) {
  // A cette etape on ne declenche plus le paiement : on ouvre le recapitulatif.
  const buttonLabel =
    paymentState === "idle" || paymentState === "error"
      ? "Vérifier ma commande"
      : buildPaymentButtonLabel(paymentState);

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
      {userCountError ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
          {userCountError}
        </p>
      ) : null}

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

function buildPaymentButtonLabel(paymentState: PaymentState) {
  if (paymentState === "starting" || paymentState === "opening") {
    return "Ouverture du paiement...";
  }

  if (paymentState === "paying") {
    return "Paiement en cours...";
  }

  if (paymentState === "confirming") {
    return "Confirmation serveur...";
  }

  if (paymentState === "validated") {
    return "Paiement confirmé";
  }

  return "Confirmer et continuer vers le paiement";
}

function buildOrderSummary(plan: PharmacyPlan | null, commitment: CommitmentOption) {
  // Le champ historique `price_per_user_month` désigne désormais le prix fixe
  // du forfait par pharmacie : il ne dépend pas du nombre d'utilisateurs.
  const monthlyPrice = parseAmount(plan?.priceMonthly ?? plan?.pricePerUserMonth);
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
