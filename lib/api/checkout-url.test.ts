import { test } from "node:test";
import assert from "node:assert/strict";

import { getSafeOPTGatewayCheckoutUrl } from "../api";

test("accepte uniquement une URL HTTPS OPTGateway", () => {
  assert.equal(
    getSafeOPTGatewayCheckoutUrl("https://pay.optgateway.com/pay/cs_test_1"),
    "https://pay.optgateway.com/pay/cs_test_1",
  );
});

test("refuse une URL de checkout inattendue", () => {
  assert.throws(
    () => getSafeOPTGatewayCheckoutUrl("https://evil.example/pay"),
    /URL de paiement OPTGateway invalide/,
  );
});
