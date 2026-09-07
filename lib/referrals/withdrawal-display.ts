// Helpers de masquage pour les numéros de téléphone dans l'historique
// des retraits. Le backend Kisinet ne renvoie PAS un numéro masqué par
// défaut, donc on l'anonymise côté frontend pour éviter d'exposer le
// numéro complet dans une liste utilisateur.

export function maskPhoneNumber(phone: string): string {
  if (!phone) {
    return "";
  }
  // Conserve chiffres, +, espaces, -, (, ) puis calcule la position
  // des premiers/derniers chiffres à conserver.
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 4) {
    return trimmed;
  }
  // On garde les 3 premiers chiffres et les 4 derniers, séparés par
  // " •••••• ". Exemple : "+243 999 123 456" -> "+24 ••••• 3456".
  // On conserve le préfixe "+" éventuel.
  const prefix = trimmed.startsWith("+") ? "+" : "";
  const head = digits.slice(0, 2);
  const tail = digits.slice(-4);
  return `${prefix}${head} ••••• ${tail}`;
}
