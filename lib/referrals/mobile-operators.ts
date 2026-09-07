// Liste statique des opérateurs Mobile Money réellement utilisés dans le
// contexte Kisinet. On NE crée PAS une liste exhaustive iKeePay car la
// documentation iKeePay ne la fournit pas ; on se limite aux opérateurs
// déjà manipulés par les payout accounts Kisinet.
//
// Si un opérateur doit être ajouté, mettre à jour cette constante.
// La valeur envoyée au backend est normalisée en MAJUSCULES par le client
// HTTP (le backend attend des codes cohérents avec iKeePay, ex: "AIRTEL",
// "ORANGE", "MPESA", "VODACOM", "MTN", "MOOV").

export type MobileOperatorOption = {
  // Code envoyé au backend (en MAJUSCULES).
  code: string;
  // Libellé humain affiché dans le select.
  label: string;
};

export const WITHDRAWAL_OPERATORS: MobileOperatorOption[] = [
  { code: "AIRTEL", label: "Airtel Money" },
  { code: "MPESA", label: "M-Pesa" },
  { code: "VODACOM", label: "Vodacom M-Pesa" },
  { code: "ORANGE", label: "Orange Money" },
  { code: "MTN", label: "MTN Mobile Money" },
  { code: "MOOV", label: "Moov Money" },
];
