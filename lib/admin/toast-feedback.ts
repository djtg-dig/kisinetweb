// Type partagé représentant un retour transitoire (succès / erreur /
// avertissement) affiché via le composant `ToastMessage`.
//
// Ce type mutualise les définitions auparavant dupliquées dans :
// - la page des fournisseurs de paiement (Payment Providers) ;
// - la page des comptes de paiement utilisateurs (User Payment Accounts).
//
// Il s'agit d'un type « superset » des deux anciennes définitions :
// - `tone` couvre `"warning"` (utilisé uniquement par les fournisseurs) ;
// - `key` est optionnel car seule la page des fournisseurs de paiement l'utilise
//   pour forcer le réaffichage du toast et redémarrer son chrono d'auto-fermeture.
// Le comportement de rendu existant est donc conservé à l'identique.

export type ToastFeedbackTone = "success" | "error" | "warning";

export type ToastFeedback = {
  tone: ToastFeedbackTone;
  text: string;
  // Identifiant permettant de forcer le réaffichage et le redémarrage du
  // chrono d'auto-fermeture même si le texte est identique à un message
  // précédent. Optionnel : non utilisé par tous les écrans.
  key?: number;
} | null;
