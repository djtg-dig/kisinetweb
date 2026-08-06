"use client";

import { Button } from "@/components/ui/button";
import { buildPlanElements } from "@/components/pricing/plan-elements";
import type { PharmacyPlan, PharmacySummary } from "@/lib/api";

export type ConfirmationTotals = {
  /** Prix catalogue par utilisateur et par mois. */
  unitPrice: number;
  /** Nombre d'utilisateurs valide retenu pour la commande. */
  userCount: number;
  /** Montant mensuel avant remise (prix unitaire x utilisateurs). */
  monthlyAmount: number;
  /** Duree d'engagement retenue, en mois. */
  durationMonths: number;
  /** Montant de la periode avant remise. */
  subtotal: number;
  /** Pourcentage de remise applique a la periode. */
  discountPercentage: number;
  /** Montant economise grace a la remise. */
  discountAmount: number;
  /** Montant final a payer pour la periode. */
  totalAmount: number;
  /** Credits IA inclus par utilisateur et par mois. */
  aiCreditsPerUser: number;
  /** Credits IA inclus au total (utilisateurs x credits). */
  aiCreditsTotal: number;
};

export function SubscriptionConfirmation({
  currency,
  disabled,
  isSubmitting,
  paymentMessage,
  paymentTone,
  plan,
  selectedPharmacy,
  submitLabel,
  totals,
  validationErrors,
  onBack,
  onConfirm,
}: {
  currency?: string;
  disabled: boolean;
  isSubmitting: boolean;
  paymentMessage: string;
  paymentTone: "error" | "success" | "neutral";
  plan: PharmacyPlan;
  selectedPharmacy: PharmacySummary | null;
  submitLabel: string;
  totals: ConfirmationTotals;
  validationErrors: string[];
  onBack: () => void;
  onConfirm: () => void;
}) {
  const planElements = buildPlanElements(plan);
  const hasErrors = validationErrors.length > 0;
  const isAnnual = totals.durationMonths > 1;
  const hasDiscount = totals.discountAmount > 0 || totals.discountPercentage > 0;
  const totalLabel = isAnnual ? "Total de la période" : "Total mensuel";

  return (
    <section
      aria-labelledby="confirmation-title"
      className="rounded-lg border border-app-border bg-app-card p-5 shadow-soft sm:p-7"
    >
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-app-muted">
          Étape finale
        </p>
        <h1 id="confirmation-title" className="mt-2 text-2xl font-bold text-app-text sm:text-3xl">
          Confirmez votre commande
        </h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          Vérifiez le récapitulatif ci-dessous avant d&apos;être redirigé vers le paiement
          sécurisé. Aucun montant n&apos;est débité à cette étape.
        </p>
      </header>

      {hasErrors && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600"
            >
              !
            </span>
            Votre commande est incomplète
          </p>
          <ul className="mt-2 grid gap-1 pl-7 text-sm leading-6 text-red-700">
            {validationErrors.map((error) => (
              <li key={error} className="list-disc">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Colonne 1 : le plan et ce qu'il contient. */}
        <div className="grid gap-6">
          <div className="rounded-lg border border-app-border bg-app-background/60 p-4 sm:p-5">
            <h2 className="text-base font-bold text-app-text">Votre plan</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <ConfirmationRow label="Plan" value={plan.name} />
              {selectedPharmacy && (
                <ConfirmationRow label="Pharmacie" value={selectedPharmacy.name} />
              )}
              <ConfirmationRow
                label="Utilisateurs"
                value={formatAmount(totals.userCount)}
              />
              <ConfirmationRow
                label="Prix par utilisateur"
                value={formatMoney(totals.unitPrice, currency) + " / mois"}
              />
              <ConfirmationRow
                label="Montant mensuel"
                value={formatMoney(totals.monthlyAmount, currency)}
              />
              <ConfirmationRow label="Devise" value={currency || "—"} />
              {totals.durationMonths > 0 && (
                <ConfirmationRow
                  label="Durée choisie"
                  value={totals.durationMonths + " mois"}
                />
              )}
              {totals.aiCreditsPerUser > 0 && (
                <>
                  <ConfirmationRow
                    label="Crédits IA par utilisateur"
                    value={formatCredits(totals.aiCreditsPerUser) + " / mois"}
                  />
                  <ConfirmationRow
                    label="Total crédits IA inclus"
                    value={formatCredits(totals.aiCreditsTotal) + " / mois"}
                  />
                </>
              )}
            </div>

            {plan.description && (
              <p className="mt-4 border-t border-app-border pt-4 text-sm leading-6 text-app-muted">
                {plan.description}
              </p>
            )}
          </div>

          {planElements.length > 0 && (
            <div className="rounded-lg border border-app-border bg-app-background/60 p-4 sm:p-5">
              <h2 className="text-base font-bold text-app-text">
                Fonctionnalités principales
              </h2>
              <ul className="mt-4 grid gap-2 text-sm">
                {planElements.map((element) => (
                  <li
                    key={element.label}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="flex items-start gap-2 text-app-muted">
                      <span aria-hidden="true" className="text-success-600">
                        ✓
                      </span>
                      {element.label}
                    </span>
                    <span className="max-w-[50%] text-right font-semibold text-app-text">
                      {element.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Colonne 2 : la facturation. */}
        <div className="grid gap-6 lg:content-start">
          <div className="rounded-lg border border-app-border bg-app-background/60 p-4 sm:p-5">
            <h2 className="text-base font-bold text-app-text">Facturation</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <ConfirmationRow
                label={
                  isAnnual
                    ? "Sous-total (" + totals.durationMonths + " mois)"
                    : "Sous-total"
                }
                value={formatMoney(totals.subtotal, currency)}
              />

              {hasDiscount ? (
                <>
                  <ConfirmationRow
                    label="Prix initial"
                    value={formatMoney(totals.subtotal, currency)}
                    strikethrough
                  />
                  <ConfirmationRow
                    label="Remise"
                    value={"−" + formatAmount(totals.discountPercentage) + " %"}
                    tone="success"
                  />
                  <ConfirmationRow
                    label="Montant économisé"
                    value={"−" + formatMoney(totals.discountAmount, currency)}
                    tone="success"
                  />
                </>
              ) : (
                <ConfirmationRow label="Remise" value="Aucune" />
              )}

              <div className="mt-2 border-t border-app-border pt-4">
                <ConfirmationRow
                  label={totalLabel}
                  value={formatMoney(totals.totalAmount, currency)}
                  strong
                />
                {isAnnual && (
                  <p className="mt-2 text-right text-xs leading-5 text-app-muted">
                    Soit {formatMoney(totals.totalAmount / totals.durationMonths, currency)}{" "}
                    par mois
                  </p>
                )}
              </div>
            </div>
          </div>

          {paymentMessage && (
            <p
              role={paymentTone === "error" ? "alert" : "status"}
              aria-live={paymentTone === "error" ? "assertive" : "polite"}
              className={`rounded-md border px-4 py-3 text-sm leading-6 ${
                paymentTone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : paymentTone === "success"
                    ? "border-success-200 bg-success-50 text-success-700"
                    : "border-app-border bg-app-surface text-app-muted"
              }`}
            >
              {paymentMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
              disabled={isSubmitting}
              className="sm:w-auto"
            >
              Retour
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={disabled}
              aria-busy={isSubmitting}
              aria-describedby={hasErrors ? "confirmation-blocked" : undefined}
              className="gap-2 sm:w-auto"
            >
              {isSubmitting && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {submitLabel}
            </Button>
          </div>

          {hasErrors && (
            <p id="confirmation-blocked" className="text-right text-xs text-app-muted">
              Corrigez les points ci-dessus pour continuer.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ConfirmationRow({
  label,
  strikethrough = false,
  strong = false,
  tone = "default",
  value,
}: {
  label: string;
  strikethrough?: boolean;
  strong?: boolean;
  tone?: "default" | "success";
  value: string;
}) {
  const valueClasses = [
    "max-w-[55%] text-right",
    strong ? "text-lg font-bold" : "font-semibold",
    tone === "success" ? "text-success-600" : "text-app-text",
    strikethrough ? "line-through opacity-70" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-app-muted">{label}</span>
      <span className={valueClasses}>{value}</span>
    </div>
  );
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

function formatCredits(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value);
}
