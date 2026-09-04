import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSafeAuthRedirect } from "./auth-utils.ts";

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
