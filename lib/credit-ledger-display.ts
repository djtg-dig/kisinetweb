import type { CreditLedgerEntry } from "@/lib/api/billing";

export type CreditLedgerDisplay = {
  title: string;
  description: string;
  amount: string;
  direction: "credit" | "debit" | "neutral";
};

type LedgerMovement = Pick<CreditLedgerEntry, "entryType" | "source" | "amount" | "creditPeriod">;

const formatCredits = (amount: number) => `${amount.toLocaleString("fr-FR")} crédits`;

/**
 * Convertit l'écriture immuable renvoyée par Django en un libellé utilisateur.
 * Le backend envoie un montant toujours positif : le type porte seul le sens.
 */
export function getCreditLedgerDisplay(entry: LedgerMovement): CreditLedgerDisplay {
  const amount = formatCredits(entry.amount);
  const historicalAllocation = entry.entryType === "MONTHLY_ALLOCATION" && entry.source === "INCLUDED";

  if (historicalAllocation) {
    return { title: "Ancienne attribution de crédits", description: "Crédits inclus d'une ancienne période d'abonnement.", amount: `+${amount}`, direction: "credit" };
  }

  switch (entry.entryType) {
    case "MONTHLY_ALLOCATION":
      return { title: "Attribution de crédits", description: "Crédits ajoutés à votre solde.", amount: `+${amount}`, direction: "credit" };
    case "PURCHASE":
      return { title: "Crédits IA achetés", description: "Crédits ajoutés après confirmation du paiement.", amount: `+${amount}`, direction: "credit" };
    case "CONSUMPTION":
      return { title: "Analyse IA effectuée", description: "Crédits utilisés pour une analyse IA.", amount: `-${amount}`, direction: "debit" };
    case "EXPIRATION":
      return { title: "Crédits expirés", description: "Crédits d'une ancienne période arrivés à expiration.", amount: `-${amount}`, direction: "debit" };
    // Non émis par le backend actuel, mais explicitement compris si l'API évolue.
    case "REFUND":
    case "REFUNDED":
      return { title: "Crédits remboursés", description: "Crédits reversés à votre solde.", amount: `+${amount}`, direction: "credit" };
    case "RESERVATION":
    case "RESERVED":
      return { title: "Crédits réservés", description: "Crédits temporairement réservés pour une opération.", amount: `-${amount}`, direction: "debit" };
    case "ADJUSTMENT":
      return { title: "Ajustement de crédits", description: "Mouvement administratif enregistré sur votre portefeuille.", amount, direction: "neutral" };
    default:
      return { title: "Mouvement de crédits", description: "Mouvement enregistré sur votre portefeuille.", amount, direction: "neutral" };
  }
}
