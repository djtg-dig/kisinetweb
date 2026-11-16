import assert from "node:assert/strict";
import { test } from "node:test";

import type { PharmacyPermissions } from "./api.ts";
import { ApiError } from "./api/errors.ts";
import {
  MEMBER_INVITATION_PERMISSION_MESSAGE,
  MEMBER_LIMIT_REACHED_MESSAGE,
  canPayPharmacySubscription,
  getMemberInvitationErrorMessage,
  isSubscriptionInactiveError,
} from "./subscription-access.ts";

test("un abonnement actif ne transforme pas un 403 de permission en erreur d'abonnement", () => {
  const error = new ApiError("Accès refusé.", undefined, 403);

  assert.equal(isSubscriptionInactiveError(error, { is_active: true }), false);
});

test("un abonnement explicitement inactif avec un 403 affiche le bloc abonnement", () => {
  const error = new ApiError("Accès refusé.", undefined, 403);

  assert.equal(isSubscriptionInactiveError(error, { is_active: false }), true);
});

test("une erreur réseau ou serveur ne devient jamais une erreur d'abonnement", () => {
  assert.equal(isSubscriptionInactiveError(new Error("Failed to fetch"), { is_active: false }), false);
  assert.equal(
    isSubscriptionInactiveError(new ApiError("Erreur serveur.", undefined, 500), { is_active: false }),
    false,
  );
});

test("la permission réelle subscription_pay contrôle l'accès aux tarifs", () => {
  assert.equal(canPayPharmacySubscription({ subscription_pay: true }), true);
  assert.equal(canPayPharmacySubscription({} as PharmacyPermissions), false);
});

test("les erreurs d'invitation distinguent limite, permission et validation", () => {
  assert.equal(
    getMemberInvitationErrorMessage(
      new ApiError("La limite d'utilisateurs de votre forfait est atteinte.", undefined, 400),
    ),
    MEMBER_LIMIT_REACHED_MESSAGE,
  );
  assert.equal(
    getMemberInvitationErrorMessage(new ApiError("Accès refusé.", undefined, 403)),
    MEMBER_INVITATION_PERMISSION_MESSAGE,
  );
  assert.equal(
    getMemberInvitationErrorMessage(new ApiError("Une invitation est déjà en attente.", undefined, 400)),
    "Une invitation est déjà en attente.",
  );
});
