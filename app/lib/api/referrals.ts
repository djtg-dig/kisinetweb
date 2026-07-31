/**
 * Types et fonctions API pour le module de parrainage.
 */

export interface ReferredPharmacy {
  id: number;
  pharmacy_reference: string;
  pharmacy_name: string;
  pharmacy_devise: string;
  referrer_reference: string;
  referral_code: string;
  status: "ACTIVE" | "CANCELLED";
  created_at: string;
  subscription_status: "ACTIVE" | "EXPIRED" | "CANCELED" | "PENDING" | null;
  subscription_plan_code: "BASIC" | "PRO" | "ENTERPRISE" | null;
  subscription_plan_name: string | null;
  subscription_is_active: boolean;
  subscription_is_trial: boolean;
  subscription_expires_at: string | null;
  total_commissions_earned: string;
  total_payments: string;
}

export interface ReferralWalletSummary {
  currency: string;
  earned_total: string;
  pending_balance: string;
  available_balance: string;
  reserved_balance: string;
  withdrawn_total: string;
  reversed_total: string;
  commissions_count: number;
  pending_withdrawals_count: number;
}

export interface ReferralCommission {
  id: number;
  pharmacy_reference: string;
  payment_reference: string;
  eligible_amount: string;
  commission_rate: string;
  commission_amount: string;
  currency: string;
  status: string;
  available_at: string | null;
  created_at: string;
}

export interface ReferralWithdrawal {
  reference: string;
  amount: string;
  currency: string;
  payout_account_reference: string;
  payment_method: string;
  destination_snapshot: Record<string, unknown>;
  status: string;
  provider_reference: string;
  rejection_reason: string;
  requested_at: string;
  processing_at: string | null;
  paid_at: string | null;
}

export interface ReferralPayoutAccount {
  reference: string;
  currency: string;
  provider: string;
  payment_method: string;
  operator: string;
  phone_number: string;
  account_name: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère la liste des pharmacies parrainées par l'utilisateur connecté.
 */
export async function getReferredPharmacies(): Promise<ReferredPharmacy[]> {
  const response = await fetch("/api/paiements/referrals/referred-pharmacies/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur lors de la récupération des pharmacies parrainées" }));
    throw new Error(error.detail || "Erreur lors de la récupération des pharmacies parrainées");
  }

  return response.json();
}

/**
 * Récupère le résumé des portefeuilles de parrainage.
 */
export async function getReferralOverview(): Promise<ReferralWalletSummary[]> {
  const response = await fetch("/api/paiements/referrals/me/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur lors de la récupération du résumé" }));
    throw new Error(error.detail || "Erreur lors de la récupération du résumé");
  }

  return response.json();
}

/**
 * Récupère la liste des commissions de parrainage.
 */
export async function getReferralCommissions(): Promise<ReferralCommission[]> {
  const response = await fetch("/api/paiements/referral-commissions/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur lors de la récupération des commissions" }));
    throw new Error(error.detail || "Erreur lors de la récupération des commissions");
  }

  return response.json();
}

/**
 * Récupère la liste des demandes de retrait.
 */
export async function getReferralWithdrawals(): Promise<ReferralWithdrawal[]> {
  const response = await fetch("/api/paiements/referral-withdrawals/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur lors de la récupération des retraits" }));
    throw new Error(error.detail || "Erreur lors de la récupération des retraits");
  }

  return response.json();
}

/**
 * Récupère la liste des comptes de retrait.
 */
export async function getReferralPayoutAccounts(): Promise<ReferralPayoutAccount[]> {
  const response = await fetch("/api/paiements/referral-payout-accounts/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur lors de la récupération des comptes de retrait" }));
    throw new Error(error.detail || "Erreur lors de la récupération des comptes de retrait");
  }

  return response.json();
}

/**
 * Crée une demande de retrait.
 */
export async function createReferralWithdrawal(data: {
  amount: string;
  currency: string;
  payout_account_reference: string;
}): Promise<ReferralWithdrawal> {
  const response = await fetch("/api/paiements/referral-withdrawals/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erreur lors de la création du retrait" }));
    throw new Error(error.detail || "Erreur lors de la création du retrait");
  }

  return response.json();
}