export type AuthTokens = {
  access: string;
  refresh: string;
};

export function readTokensFromHash(hash: string): AuthTokens | null {
  if (!hash) {
    return null;
  }

  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalizedHash);
  const access = params.get("access") || "";
  const refresh = params.get("refresh") || "";

  if (!access || !refresh) {
    return null;
  }

  return { access, refresh };
}

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
