// Helpers de logique métier pour piloter l'UI de retrait.
//
// Le frontend est la source de vérité de l'UX (bouton actif / désactivé,
// bandeau explicatif). Le backend reste la source de vérité COMPTABLE :
// ces helpers n'interviennent jamais dans la réservation.
//
// Toutes les valeurs monétaires sont des chaînes Decimal émises par le
// backend. On les convertit explicitement via `parseDecimalAmount` avant
// toute comparaison : une comparaison directe de chaînes ("10.00" < "1.08")
// donnerait un résultat faux et désactiverait silencieusement le bouton.

import type { ReferralWalletSummary } from "@/lib/api/referrals";

/**
 * Convertit une chaîne Decimal du backend en nombre exploitable pour
 * l'UI. Retourne `null` si la chaîne est vide, non parseable ou si la
 * valeur n'est pas un nombre fini.
 */
export function parseDecimalAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

export type WalletWithdrawability =
  | { canWithdraw: true; reason: "ok" }
  | { canWithdraw: false; reason: "no_wallet" }
  | {
      canWithdraw: false;
      reason: "insufficient_balance";
      available: number;
      minimumRequired: number;
    }
  | { canWithdraw: false; reason: "missing_config" };

/**
 * Détermine si l'utilisateur peut initier un retrait depuis ce wallet.
 *
 * Règles :
 * 1. Si aucun wallet n'est chargé -> pas de retrait possible.
 * 2. Si l'un des champs critiques (available_balance,
 *    minimum_required_balance) est manquant ou non parseable, on
 *    considère que la configuration de retrait n'est pas encore
 *    disponible côté serveur (`missing_config`). C'est un état
 *    explicitement non bloquant pour l'utilisateur : on ne désactive
 *    pas le bouton, on attend que le backend fournisse les champs.
 *    En pratique cela correspond à un déploiement partiel où
 *    `getReferralOverview` ne renvoie pas encore les nouveaux champs.
 * 3. Sinon, on compare les valeurs numériques :
 *    `available >= minimum_required_balance` autorise le retrait.
 */
export function evaluateWalletWithdrawability(
  wallet: ReferralWalletSummary | null | undefined,
): WalletWithdrawability {
  if (!wallet) {
    return { canWithdraw: false, reason: "no_wallet" };
  }
  const available = parseDecimalAmount(wallet.available_balance);
  const minimumRequired = parseDecimalAmount(wallet.minimum_required_balance);
  if (available === null || minimumRequired === null) {
    return { canWithdraw: false, reason: "missing_config" };
  }
  if (available < minimumRequired) {
    return {
      canWithdraw: false,
      reason: "insufficient_balance",
      available,
      minimumRequired,
    };
  }
  return { canWithdraw: true, reason: "ok" };
}
