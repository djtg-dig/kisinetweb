import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSafeAuthRedirect, readTokensFromHash } from "./auth-utils.ts";

test("readTokensFromHash lit access et refresh depuis le fragment OAuth", () => {
  assert.deepEqual(readTokensFromHash("#access=access-token&refresh=refresh-token"), {
    access: "access-token",
    refresh: "refresh-token",
  });
});

test("readTokensFromHash refuse un fragment incomplet", () => {
  assert.equal(readTokensFromHash("#access=access-token"), null);
  assert.equal(readTokensFromHash("#refresh=refresh-token"), null);
  assert.equal(readTokensFromHash(""), null);
});

test("buildSafeAuthRedirect accepte seulement les chemins internes", () => {
  assert.equal(buildSafeAuthRedirect("/app/select-pharmacy"), "/app/select-pharmacy");
  assert.equal(
    buildSafeAuthRedirect(encodeURIComponent("/app/pharmacies/PH123/dashboard")),
    "/app/pharmacies/PH123/dashboard",
  );
  assert.equal(buildSafeAuthRedirect("https://example.com"), "/app/select-pharmacy");
  assert.equal(buildSafeAuthRedirect("//example.com"), "/app/select-pharmacy");
  assert.equal(buildSafeAuthRedirect(null), "/app/select-pharmacy");
});
