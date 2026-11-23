import assert from "node:assert/strict";
import { test } from "node:test";

import { PRESCRIPTION_ANALYSIS_ENABLED } from "./feature-flags.ts";

test("désactive temporairement l'analyse d'ordonnance", () => {
  assert.equal(PRESCRIPTION_ANALYSIS_ENABLED, false);
});
