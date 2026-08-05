/**
 * Helpers d'affichage des comptes de paiement utilisateurs (espace admin).
 *
 * L'API `/api/admin/user-payment-accounts/` renvoie des identifiants bruts
 * (`user` = UUID, `provider` = id du fournisseur). Ces fonctions transforment
 * ces identifiants en libellés lisibles à partir des listes déjà exposées par
 * l'API admin (utilisateurs, fournisseurs, pays).
 *
 * Ce module est purement lecture : il ne fait aucun appel réseau et ne modifie
 * aucune donnée.
 */

import type {
  AdminCountryOption,
  AdminPaymentProvider,
  AdminProfile,
} from "@/lib/api/admin";

// Formate une date ISO en date + heure françaises. Renvoie "-" si la valeur est
// absente et la valeur brute si elle n'est pas une date valide.
export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Retrouve l'utilisateur propriétaire d'un compte dans l'annuaire admin.
export function findAccountUser(
  userId: string,
  users: AdminProfile[],
): AdminProfile | null {
  return users.find((user) => user.id === userId) ?? null;
}

// Libellé lisible d'un utilisateur : email, puis nom complet, puis référence.
// L'UUID est conservé comme dernier recours (annuaire non chargé par exemple).
export function resolveUserLabel(userId: string, users: AdminProfile[]): string {
  const user = findAccountUser(userId, users);
  if (!user) {
    return userId || "-";
  }

  const fullName = [user.first_name, user.last_name]
    .filter((part) => Boolean(part && part.trim()))
    .join(" ");

  return user.email || fullName || user.reference || userId;
}

// Retrouve le fournisseur de paiement associé à un compte.
export function findAccountProvider(
  providerId: number,
  providers: AdminPaymentProvider[],
): AdminPaymentProvider | null {
  return providers.find((provider) => provider.id === providerId) ?? null;
}

// Libellé lisible d'un fournisseur : nom affiché, nom, puis code.
export function resolveProviderLabel(
  providerId: number,
  providers: AdminPaymentProvider[],
): string {
  const provider = findAccountProvider(providerId, providers);
  if (!provider) {
    return providerId ? `Fournisseur #${providerId}` : "-";
  }

  return provider.display_name || provider.name || provider.code || `Fournisseur #${providerId}`;
}

// Nom du pays rattaché au fournisseur du compte.
// Le sérialiseur admin renvoie l'identifiant (clé primaire) du pays, mais
// certaines réponses peuvent contenir un code ISO2 : les deux sont acceptés.
export function resolveProviderCountryLabel(
  provider: AdminPaymentProvider | null,
  countries: AdminCountryOption[],
): string {
  if (!provider) {
    return "-";
  }

  const rawCountry = String(provider.country ?? "").trim();
  if (!rawCountry) {
    return "-";
  }

  const countryById = countries.find((country) => String(country.id) === rawCountry);
  if (countryById) {
    return countryById.name;
  }

  const countryByIso2 = countries.find(
    (country) => country.iso2.toUpperCase() === rawCountry.toUpperCase(),
  );

  return countryByIso2 ? countryByIso2.name : rawCountry;
}
