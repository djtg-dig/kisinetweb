// Tests de classification des erreurs d'analyse IA côté frontend.
//
// Vérifie que le frontend affiche le bon message utilisateur en se basant sur
// le champ `code` du backend, et JAMAIS sur une recherche textuelle dans le
// détail. Couvre les cas du contrat docs/backend-api.md :
//   CAS 1 : 402 USER_CREDIT_EXHAUSTED        -> message crédits insuffisants
//   CAS 2 : 502 AI_PROVIDER_ERROR            -> indisponibilité IA (pas crédits)
//   CAS 3 : 503 AI_SERVICE_UNAVAILABLE       -> indisponibilité IA (pas crédits)
//   CAS 4 : 422 PRESCRIPTION_ANALYSIS_FAILED -> message fonctionnel du backend
//   CAS 5 : 429 / RESOURCE_EXHAUSTED         -> indisponibilité IA (pas crédits)

import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError, describeApiError, CREDIT_EXHAUSTED_MESSAGE, AI_UNAVAILABLE_MESSAGE } from "./errors.ts";

const CREDIT_TEXT = "Crédits insuffisants";

test("CAS 1 : USER_CREDIT_EXHAUSTED (402) affiche le message de crédits insuffisants", () => {
  const error = new ApiError(
    "Crédits insuffisants : les crédits inclus et les crédits achetés de cette pharmacie sont épuisés.",
    "USER_CREDIT_EXHAUSTED",
    402,
  );
  const message = describeApiError(error);
  assert.equal(message, CREDIT_EXHAUSTED_MESSAGE);
  assert.match(message, new RegExp(CREDIT_TEXT));
});

test("CAS 2 : AI_PROVIDER_ERROR (502) n'affiche PAS de message de crédits", () => {
  const error = new ApiError(
    "Le service d'analyse IA est temporairement indisponible. Veuillez réessayer plus tard.",
    "AI_PROVIDER_ERROR",
    502,
  );
  const message = describeApiError(error);
  assert.equal(message, AI_UNAVAILABLE_MESSAGE);
  assert.doesNotMatch(message, new RegExp(CREDIT_TEXT));
});

test("CAS 3 : AI_SERVICE_UNAVAILABLE (503) n'affiche PAS de message de crédits", () => {
  const error = new ApiError(
    "Le service d'analyse IA est temporairement indisponible. Veuillez réessayer plus tard.",
    "AI_SERVICE_UNAVAILABLE",
    503,
  );
  const message = describeApiError(error);
  assert.equal(message, AI_UNAVAILABLE_MESSAGE);
  assert.doesNotMatch(message, new RegExp(CREDIT_TEXT));
});

test("CAS 4 : PRESCRIPTION_ANALYSIS_FAILED (422) affiche le message fonctionnel du backend", () => {
  const functionalMessage = "L'image de l'ordonnance est illisible ou ne contient aucun médicament.";
  const error = new ApiError(functionalMessage, "PRESCRIPTION_ANALYSIS_FAILED", 422);
  const message = describeApiError(error);
  assert.equal(message, functionalMessage);
  assert.doesNotMatch(message, new RegExp(CREDIT_TEXT));
});

test("CAS 5a : 429 (rate_limited) n'affiche PAS de message de crédits", () => {
  const error = new ApiError(
    "Trop de tentatives. Veuillez patienter avant de réessayer.",
    "rate_limited",
    429,
  );
  const message = describeApiError(error);
  assert.doesNotMatch(message, new RegExp(CREDIT_TEXT));
});

test("CAS 5b : Error générique contenant RESOURCE_EXHAUSTED n'affiche PAS de message de crédits", () => {
  // Simule un détail fournisseur Gemini/Google Vision remonté tel quel.
  const error = new Error("429 RESOURCE_EXHAUSTED: quota exceeded for model gemini-pro-vision");
  const message = describeApiError(error);
  assert.equal(message, AI_UNAVAILABLE_MESSAGE);
  assert.doesNotMatch(message, new RegExp(CREDIT_TEXT));
});

test("Un code inconnu ne déclenche jamais le message de crédits", () => {
  const error = new ApiError("Erreur inattendue du service.", "UNKNOWN_ERROR", 500);
  const message = describeApiError(error);
  assert.equal(message, "Erreur inattendue du service.");
  assert.doesNotMatch(message, new RegExp(CREDIT_TEXT));
});

test("describeApiError reste robuste face à une valeur non-Error", () => {
  const message = describeApiError("chaîne brute");
  assert.equal(message, "Une erreur est survenue.");
});
