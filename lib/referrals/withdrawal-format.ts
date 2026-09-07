// Helpers purement UX pour l'aperçu du retrait. Aucune logique comptable
// : les valeurs réellement réservées sont TOUJOURS celles retournées par
// le backend (fee_amount, total_reserved_amount) après création.

import { WITHDRAWAL_COUNTRIES } from "@/lib/referrals/countries";

export function formatAmount(value: string | number, currency: string): string {
  // Les montants backend sont des chaînes Decimal ("10.00"). On formate
  // pour l'affichage utilisateur en fr-FR (ex: "10,00 USD").
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return `${value} ${currency}`.trim();
  }
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
  return `${formatted} ${currency}`.trim();
}

export function formatPercent(value: string | number): string {
  // Le backend expose les taux en valeur (8.00 pour 8%).
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return `${value} %`;
  }
  // On supprime les zéros inutiles (8.00 -> "8", 8.5 -> "8,5").
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(numeric);
  return `${formatted} %`;
}

export function isPhoneNumberFormatValid(phone: string): boolean {
  // Validation UX légère. La normalisation fine est faite par le backend.
  // On accepte : chiffres, espaces, +, -, (, ).
  const cleaned = phone.trim();
  if (!cleaned) {
    return false;
  }
  if (cleaned.length < 6 || cleaned.length > 30) {
    return false;
  }
  // Au moins 6 chiffres au total.
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 6;
}

export function isCountryCodeValid(country: string): boolean {
  if (!country) {
    return false;
  }
  const upper = country.trim().toUpperCase();
  // Soit le code est dans notre liste statique, soit on accepte un
  // code ISO 3166-1 alpha-2 générique (2 lettres) si l'utilisateur
  // l'a saisi manuellement. Le backend est la validation finale.
  if (WITHDRAWAL_COUNTRIES.some((c) => c.iso2 === upper)) {
    return true;
  }
  return /^[A-Z]{2}$/.test(upper);
}

export function isOperatorCodeValid(operator: string): boolean {
  if (!operator) {
    return false;
  }
  // Le backend accepte des libellés en MAJUSCULES ; on vérifie juste
  // qu'il n'est pas vide et qu'il a une forme plausible.
  return /^[A-Z0-9 _-]{2,30}$/.test(operator.trim().toUpperCase());
}

// Estimation locale (non-comptable) pour l'aperçu avant soumission.
// Le backend peut retourner un fee légèrement différent en raison
// d'arrondis successifs : on ne s'engage pas à un centime près.
export function previewFeeAndTotal(
  amount: string,
  feeRate: string,
): { fee: number; total: number } | null {
  const amountNumber = Number(amount);
  const rateNumber = Number(feeRate);
  if (!Number.isFinite(amountNumber) || !Number.isFinite(rateNumber)) {
    return null;
  }
  if (amountNumber <= 0 || rateNumber < 0) {
    return null;
  }
  const fee = Math.round((amountNumber * rateNumber) / 10000) * 100;
  // fee est ici en centimes (Math.round × 100) pour éviter les artefacts
  // de virgule flottante. On revient en unités.
  const feeInUnits = fee / 100;
  return {
    fee: feeInUnits,
    total: Math.round((amountNumber + feeInUnits) * 100) / 100,
  };
}
