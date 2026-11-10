const LICENSE_LIMIT_MESSAGE =
  "Votre licence actuelle ne permet pas de créer une pharmacie supplémentaire.";

export function isPharmacyLicenseLimitError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.replace(/\s+/g, " ").trim();
  return normalizedMessage === LICENSE_LIMIT_MESSAGE;
}
