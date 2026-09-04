export function buildSafeAuthRedirect(next: string | null | undefined) {
  if (!next) {
    return "/app/select-pharmacy";
  }

  try {
    const decodedNext = decodeURIComponent(next);
    if (decodedNext.startsWith("/") && !decodedNext.startsWith("//")) {
      return decodedNext;
    }
  } catch {
    // Valeur invalide : on retombe vers l'espace pharmacie.
  }

  return "/app/select-pharmacy";
}
