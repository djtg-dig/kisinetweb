export const AUTH_NEXT_COOKIE_NAME = "kisinet_auth_next";
export const AUTH_NEXT_COOKIE_MAX_AGE_SECONDS = 10 * 60;

export function buildSafeAuthRedirect(next: string | null | undefined) {
  if (!next) {
    return "/app/select-pharmacy";
  }

  try {
    const decodedNext = decodeURIComponent(next);
    if (
      decodedNext.startsWith("/") &&
      !decodedNext.startsWith("//") &&
      !decodedNext.includes("\\")
    ) {
      return decodedNext;
    }
  } catch {
    // Valeur invalide : on retombe vers l'espace pharmacie.
  }

  return "/app/select-pharmacy";
}
