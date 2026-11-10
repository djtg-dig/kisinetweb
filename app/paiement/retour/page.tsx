"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { PublicLayout } from "@/components/layout/public-layout";
import {
  getPharmacySubscriptionPayment,
  getPharmacySubscriptionPayments,
  getUserPharmacies,
  type PharmacySummary,
  type PharmacySubscriptionPayment,
} from "@/lib/api";
import {
  findPaymentByProviderReference,
  getSubscriptionReturnState,
  type SubscriptionReturnState,
} from "@/lib/subscription-return";

type ReturnPageState = "loading" | "ready" | "error";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 10;

export default function OptGatewayReturnPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() || "";
  const [pageState, setPageState] = useState<ReturnPageState>("loading");
  const [returnState, setReturnState] = useState<SubscriptionReturnState>("unknown");
  const [payment, setPayment] = useState<PharmacySubscriptionPayment | null>(null);
  const [pharmacy, setPharmacy] = useState<PharmacySummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const verifyPayment = useCallback(async () => {
    if (!sessionId) {
      setPageState("error");
      setErrorMessage("La session de paiement est absente ou invalide.");
      return true;
    }

    const pharmacies = await getUserPharmacies();
    const candidates = await Promise.allSettled(
      pharmacies
        .filter((candidate) => Boolean(candidate.reference))
        .map(async (candidate) => ({
          pharmacy: candidate,
          payments: await getPharmacySubscriptionPayments(candidate.reference as string),
        })),
    );

    for (const candidate of candidates) {
      if (candidate.status !== "fulfilled") {
        continue;
      }

      const matchedPayment = findPaymentByProviderReference(candidate.value.payments, sessionId);
      if (!matchedPayment || !candidate.value.pharmacy.reference) {
        continue;
      }

      const verifiedPayment = await getPharmacySubscriptionPayment(
        matchedPayment.id,
        candidate.value.pharmacy.reference,
      );
      const verifiedState = getSubscriptionReturnState(verifiedPayment.status);
      setPayment(verifiedPayment);
      setPharmacy(candidate.value.pharmacy);
      setReturnState(verifiedState);
      setPageState("ready");
      return verifiedState !== "pending";
    }

    setPageState("ready");
    setReturnState("pending");
    return false;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAndPoll() {
      setPageState("loading");
      setErrorMessage("");

      try {
        for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
          if (cancelled) {
            return;
          }

          const isTerminal = await verifyPayment();
          if (isTerminal || attempt === MAX_POLLS - 1) {
            return;
          }

          await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPageState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Le statut du paiement ne peut pas encore être vérifié.",
        );
      }
    }

    void loadAndPoll();
    return () => {
      cancelled = true;
    };
  }, [verifyPayment]);

  const dashboardHref = pharmacy
    ? `/app/pharmacies/${encodeURIComponent(pharmacy.id)}/dashboard`
    : "";

  return (
    <PublicLayout>
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full rounded-xl border border-app-border bg-app-surface p-8 text-center shadow-sm">
          {pageState === "loading" ? <LoadingBubble label="Vérification du paiement" /> : null}

          {pageState === "error" ? (
            <>
              <h1 className="text-2xl font-bold text-app-text">Paiement à vérifier</h1>
              <p className="mt-3 text-app-muted">{errorMessage}</p>
            </>
          ) : null}

          {pageState === "ready" && returnState === "success" ? (
            <>
              <h1 className="text-2xl font-bold text-app-text">Paiement confirmé</h1>
              <p className="mt-3 text-app-muted">
                Votre paiement a été confirmé par Kisinet. L’abonnement sera visible dans la pharmacie.
              </p>
            </>
          ) : null}

          {pageState === "ready" && returnState === "pending" ? (
            <>
              <h1 className="text-2xl font-bold text-app-text">Paiement en attente de confirmation</h1>
              <p className="mt-3 text-app-muted">
                Le paiement est encore en cours de vérification par Kisinet. Cette page ne confirme pas le paiement à elle seule.
              </p>
            </>
          ) : null}

          {pageState === "ready" && returnState === "failed" ? (
            <>
              <h1 className="text-2xl font-bold text-app-text">Paiement échoué</h1>
              <p className="mt-3 text-app-muted">Le paiement n’a pas été confirmé.</p>
            </>
          ) : null}

          {pageState === "ready" && returnState === "cancelled" ? (
            <>
              <h1 className="text-2xl font-bold text-app-text">Paiement annulé</h1>
              <p className="mt-3 text-app-muted">La session de paiement a été annulée.</p>
            </>
          ) : null}

          {pageState === "ready" && returnState === "unknown" ? (
            <>
              <h1 className="text-2xl font-bold text-app-text">Paiement à vérifier</h1>
              <p className="mt-3 text-app-muted">Le statut reçu ne permet pas de confirmer le paiement.</p>
            </>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {dashboardHref && returnState === "success" ? (
              <LinkButton href={dashboardHref}>Retour à la pharmacie</LinkButton>
            ) : null}
            <LinkButton href="/tarifs" variant="secondary">Voir les tarifs</LinkButton>
          </div>

          {payment ? <p className="sr-only">Référence du reçu : {payment.reference}</p> : null}
        </section>
      </main>
    </PublicLayout>
  );
}
