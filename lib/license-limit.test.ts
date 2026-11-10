import assert from "node:assert/strict";
import test from "node:test";

import { isPharmacyLicenseLimitError } from "./license-limit";

test("reconnaît uniquement le message de limite de licence", () => {
  assert.equal(
    isPharmacyLicenseLimitError(
      new Error("Votre licence actuelle ne permet pas de créer une pharmacie supplémentaire."),
    ),
    true,
  );
  assert.equal(
    isPharmacyLicenseLimitError(new Error("Nom de pharmacie obligatoire.")),
    false,
  );
  assert.equal(isPharmacyLicenseLimitError(new TypeError("fetch failed")), false);
});
