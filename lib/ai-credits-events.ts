// Événement global déclenché après une analyse d'ordonnance par l'IA.
// Permet à d'autres pages (ex. l'espace personnel) d'actualiser les crédits IA.
export const AI_CREDITS_UPDATED_EVENT = "kisinet:ai-credits-updated";

export function notifyAiCreditsUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(AI_CREDITS_UPDATED_EVENT));
}
