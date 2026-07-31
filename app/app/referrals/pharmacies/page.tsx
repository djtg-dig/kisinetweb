"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getReferredPharmacies,
  type ReferredPharmacy,
} from "@/lib/api/referrals";

type PageState = "loading" | "ready" | "error";

/**
 * Page dédiée à l'affichage détaillé des pharmacies parrainées.
 * Accessible via le clic sur "Pharmacies parrainées" depuis /app/referrals.
 * 
 * Affiche pour chaque pharmacie :
 * - Nom et référence
 * - Statut de l'abonnement (actif, en essai, expiré)
 * - Plan actuel (BASIC, PRO, ENTERPRISE)
 * - Date d'expiration
 * - Commissions gagnées
 * - Paiements totaux
 */
export default function ReferredPharmaciesPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pharmacies, setPharmacies] = useState<ReferredPharmacy[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadPharmacies();
  }, []);

  async function loadPharmacies() {
    try {
      setPageState("loading");
      setError("");
      const data = await getReferredPharmacies();
      setPharmacies(data);
      setPageState("ready");
    } catch (err) {
      setPageState("error");
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des pharmacies parrainées.");
    }
  }

  /**
   * Formate une date ISO en format lisible
   */
  function formatDate(dateString: string | null): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Formate un montant décimal avec la devise
   */
  function formatAmount(amount: string, currency: string): string {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  }

  /**
   * Retourne la variante de badge selon le statut d'abonnement
   */
  function getSubscriptionBadgeVariant(
    status: string | null,
    isTrial: boolean
  ): "default" | "secondary" | "destructive" | "outline" {
    if (!status || status === "EXPIRED" || status === "CANCELED") {
      return "destructive";
    }
    if (isTrial) {
      return "secondary";
    }
    return "default";
  }

  if (pageState === "loading") {
    return (
      <MainLayout>
        <section className="border-b border-app-border bg-app-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-primary-700">Parrainage</p>
              <h1 className="mt-2 text-3xl font-bold text-app-text">Pharmacies Parrainées</h1>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingBubble label="Chargement des pharmacies parrainées" className="min-h-[400px]" />
        </section>
      </MainLayout>
    );
  }

  if (pageState === "error") {
    return (
      <MainLayout>
        <section className="border-b border-app-border bg-app-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-primary-700">Parrainage</p>
              <h1 className="mt-2 text-3xl font-bold text-app-text">Pharmacies Parrainées</h1>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">Erreur</p>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <Button onClick={loadPharmacies} className="mt-4">
              Réessayer
            </Button>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Parrainage</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Pharmacies Parrainées</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Suivez les performances de vos pharmacies parrainées et les commissions générées.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {pharmacies.length === 0 ? (
          <div className="rounded-lg border border-app-border bg-app-card p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-app-text">Aucune pharmacie parrainée</h2>
            <p className="mt-2 text-sm text-app-muted">
              Vous n'avez pas encore parrainé de pharmacie. Partagez votre code de parrainage pour commencer à gagner des commissions.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* En-tête avec nom et badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-app-text">{pharmacy.pharmacy_name}</h3>
                    <p className="mt-1 text-sm font-mono text-app-muted">{pharmacy.pharmacy_reference}</p>
                  </div>
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${
                      getSubscriptionBadgeVariant(pharmacy.subscription_status, pharmacy.subscription_is_trial) === "destructive"
                        ? "bg-red-100 text-red-700"
                        : pharmacy.subscription_is_trial
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {pharmacy.subscription_is_trial ? "Essai" : pharmacy.subscription_plan_name || "N/A"}
                  </span>
                </div>

                {/* Statut de l'abonnement */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        pharmacy.subscription_is_active ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="font-medium">
                      {pharmacy.subscription_is_active ? "Actif" : "Inactif"}
                    </span>
                    {pharmacy.subscription_is_trial && (
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Essai gratuit
                      </span>
                    )}
                  </div>

                  {pharmacy.subscription_expires_at && (
                    <div className="flex items-center gap-2 text-sm text-app-muted">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Expire le {formatDate(pharmacy.subscription_expires_at)}</span>
                    </div>
                  )}
                </div>

                {/* Statistiques financières */}
                <div className="mt-4 space-y-2 border-t border-app-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-app-muted">Commissions gagnées</span>
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatAmount(pharmacy.total_commissions_earned, pharmacy.pharmacy_devise)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-app-muted">Paiements totaux</span>
                    <div className="flex items-center gap-1 font-semibold text-app-text">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{formatAmount(pharmacy.total_payments, pharmacy.pharmacy_devise)}</span>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="mt-4 border-t border-app-border pt-3 text-xs text-app-muted">
                  <p>Parrainé le {formatDate(pharmacy.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}