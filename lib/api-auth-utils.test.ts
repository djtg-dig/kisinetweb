import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isAuthorizationDeniedStatus,
  isSessionExpiredStatus,
} from "./api-auth-utils.ts";

test("401 est traité comme une session invalide ou expirée", () => {
  assert.equal(isSessionExpiredStatus(401), true);
  assert.equal(isAuthorizationDeniedStatus(401), false);
});

test("403 est traité comme un refus d'autorisation sans refresh", () => {
  assert.equal(isAuthorizationDeniedStatus(403), true);
  assert.equal(isSessionExpiredStatus(403), false);
});
