"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { WITHDRAWAL_COUNTRIES } from "@/lib/referrals/countries";
import { WITHDRAWAL_OPERATORS } from "@/lib/referrals/mobile-operators";
import {
  formatAmount,
  formatPercent,
  isCountryCodeValid,
  isOperatorCodeValid,
  isPhoneNumberFormatValid,
  previewFeeAndTotal,
} from "@/lib/referrals/withdrawal-format";
import type { ReferralWalletSummary } from "@/lib/api/referrals";

// Mapping local des statuts iKeePay vers libellés utilisateur français.
// Ces libellés sont présentationnels : la source de vérité reste le code
// retourné par le backend (REQUESTED, PROCESSING, PAID, FAILED, ...).
//
// REQUESTED est conservé comme état technique transitoire (créé
// localement mais pas encore soumis au provider). C'est très bref
// dans le flux normal, l'utilisateur final voit principalement
// PROCESSING (En cours) après un POST réussi.
export const REFERRAL_WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Préparation",
  PROCESSING: "En cours",
  PAID: "Payé",
  FAILED: "Échec",
  CANCELLED: "Annulé",
  REJECTED: "Rejeté",
};

export function withdrawalStatusLabel(status: string): string {
  return REFERRAL_WITHDRAWAL_STATUS_LABELS[status] || status;
}

type WithdrawalDialogProps = {
  open: boolean;
  onClose: () => void;
  // Wallet actif sur lequel le retrait sera prélevé.
  wallet: ReferralWalletSummary | null;
  // Soumission déclenchée par le parent : le parent gère l'appel API et
  // l'état isSubmitting. On ne dédouble pas la logique.
  onSubmit: (payload: {
    amount: string;
    country: string;
    phone_number: string;
    operator: string;
  }) => void;
  isSubmitting: boolean;
  // Message d'erreur/succès à afficher dans la modal (déjà humanisé
  // par le parent).
  message?: string;
};

// Modal de retrait en mode "destination directe".
// Le frontend collecte UNIQUEMENT les informations de destination et le
// montant ; le backend recalcule fee_rate/fee_amount/total_reserved_amount
// à partir du BusinessConfig snapshoté.
export function WithdrawalDialog({
  open,
  onClose,
  wallet,
  onSubmit,
  isSubmitting,
  message,
}: WithdrawalDialogProps) {
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState<string>("CD");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [operator, setOperator] = useState<string>(WITHDRAWAL_OPERATORS[0]?.code || "");
  const [touched, setTouched] = useState(false);

  // Réinitialise le formulaire à l'ouverture. Indispensable pour éviter
  // qu'une saisie précédente reste affichée après une annulation ou
  // une soumission réussie.
  useEffect(() => {
    if (open) {
      setAmount("");
      setCountry("CD");
      setPhoneNumber("");
      setOperator(WITHDRAWAL_OPERATORS[0]?.code || "");
      setTouched(false);
    }
  }, [open]);

  const amountNumber = Number(amount);
  const minAmount = wallet ? Number(wallet.minimum_withdrawal_amount) : 0;
  const maxAmount = wallet ? Number(wallet.max_withdrawable_amount) : 0;
  const available = wallet ? Number(wallet.available_balance) : 0;

  // Aperçu local non-comptable. Le backend reste la source de vérité.
  const preview = useMemo(
    () => (wallet ? previewFeeAndTotal(amount, wallet.withdrawal_fee_rate) : null),
    [amount, wallet],
  );

  // Blocages UX : on n'autorise pas la saisie de valeurs manifestement
  // hors intervalle. Le backend revérifie et refusera au dernier mot.
  const amountTooLow = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber < minAmount;
  const amountTooHigh = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber > maxAmount;
  const amountInvalid = amount !== "" && (!Number.isFinite(amountNumber) || amountNumber <= 0);

  const phoneValid = isPhoneNumberFormatValid(phoneNumber);
  const countryValid = isCountryCodeValid(country);
  const operatorValid = isOperatorCodeValid(operator);

  // L'utilisateur peut soumettre si tous les champs UX sont valides.
  // Le wallet doit autoriser un retrait (solde >= minimum_required_balance).
  const canSubmit =
    !!wallet &&
    Number.isFinite(amountNumber) &&
    amountNumber >= minAmount &&
    amountNumber <= maxAmount &&
    phoneValid &&
    countryValid &&
    operatorValid;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) {
      return;
    }
    onSubmit({
      amount: amountNumber.toFixed(2),
      country: country.trim().toUpperCase(),
      phone_number: phoneNumber.trim(),
      operator: operator.trim().toUpperCase(),
    });
  }

  if (!wallet) {
    // Si aucun wallet actif (devise inconnue, wallet inexistant), la
    // modal reste vide ; le bouton "Retirer" n'est de toute
    // façon pas ouvert dans cet état par le parent.
    return null;
  }

  const canWithdraw = available >= Number(wallet.minimum_required_balance);

  return (
    <Modal
      open={open}
      title="Confirmer le retrait"
      onClose={onClose}
      saving={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!canWithdraw && (
          <p className="rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-muted">
            Votre solde est insuffisant pour effectuer un retrait.
          </p>
        )}

        <section className="rounded-md border border-app-border bg-app-surface p-3 text-sm">
          <dl className="grid grid-cols-2 gap-2 text-app-text">
            <div>
              <dt className="text-xs font-semibold uppercase text-app-muted">Disponible</dt>
              <dd className="font-bold">{formatAmount(available, wallet.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-app-muted">Frais de retrait</dt>
              <dd className="font-bold">{formatPercent(wallet.withdrawal_fee_rate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-app-muted">Retrait minimum</dt>
              <dd className="font-bold">{formatAmount(wallet.minimum_withdrawal_amount, wallet.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-app-muted">Retrait maximum</dt>
              <dd className="font-bold">{formatAmount(wallet.max_withdrawable_amount, wallet.currency)}</dd>
            </div>
          </dl>
        </section>

        <label className="block text-sm font-semibold text-app-text">
          Montant à recevoir ({wallet.currency})
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onBlur={() => setTouched(true)}
            inputMode="decimal"
            required
            min={minAmount}
            max={maxAmount}
            step="0.01"
            placeholder={minAmount.toFixed(2)}
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
          <p className="mt-1 text-xs text-app-muted">
            Minimum : {formatAmount(minAmount, wallet.currency)} — Maximum :{" "}
            {formatAmount(maxAmount, wallet.currency)}
          </p>
          {touched && amountInvalid && (
            <p className="mt-1 text-xs text-red-700">Montant invalide.</p>
          )}
          {touched && amountTooLow && (
            <p className="mt-1 text-xs text-red-700">
              Le montant minimum de retrait est de {formatAmount(minAmount, wallet.currency)}.
            </p>
          )}
          {touched && amountTooHigh && (
            <p className="mt-1 text-xs text-red-700">
              Le montant maximum actuellement retirable est de {formatAmount(maxAmount, wallet.currency)}.
            </p>
          )}
        </label>

        <label className="block text-sm font-semibold text-app-text">
          Pays
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            {WITHDRAWAL_COUNTRIES.map((option) => (
              <option key={option.iso2} value={option.iso2}>
                {option.iso2} — {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-app-text">
          Numéro Mobile Money
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            onBlur={() => setTouched(true)}
            inputMode="tel"
            required
            placeholder="+243 999 123 456"
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
          {touched && !phoneValid && (
            <p className="mt-1 text-xs text-red-700">
              Vérifiez le numéro de téléphone (au moins 6 chiffres).
            </p>
          )}
        </label>

        <label className="block text-sm font-semibold text-app-text">
          Opérateur
          <select
            value={operator}
            onChange={(event) => setOperator(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-card px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            {WITHDRAWAL_OPERATORS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* Aperçu local non-comptable : seules les valeurs du backend
            après soumission font foi. */}
        {preview && Number.isFinite(amountNumber) && amountNumber > 0 && (
          <section className="rounded-md border border-app-border bg-app-surface p-3 text-sm text-app-muted">
            <p>Aperçu (indicatif, le backend reste la source de vérité)</p>
            <dl className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <dt className="text-xs font-semibold uppercase">À recevoir</dt>
                <dd className="font-bold text-app-text">{formatAmount(amountNumber, wallet.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase">Frais estimés</dt>
                <dd className="font-bold text-app-text">{formatAmount(preview.fee, wallet.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase">Total utilisé sur votre solde</dt>
                <dd className="font-bold text-app-text">{formatAmount(preview.total, wallet.currency)}</dd>
              </div>
            </dl>
          </section>
        )}

        {message && (
          <p className="rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-muted">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting || !canWithdraw}>
            {isSubmitting ? "Envoi en cours..." : "Confirmer le retrait"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
