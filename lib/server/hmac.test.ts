import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildCanonicalRequest,
  canonicalizePathAndQuery,
  computeBodySha256,
  computeHmacSignature,
  createHmacHeaders,
} from "@/lib/server/hmac";

const CLIENT_ID = "kisinet-web";
const SECRET = "test-hmac-secret-for-kisinet-web";
const TIMESTAMP = "1788451200";

describe("HMAC Python/Node vector compatibility", () => {
  test("vecteur Python officiel - body SHA256", () => {
    const body = '{"amount":100,"currency":"USD"}';
    const bodySha256 = computeBodySha256(new TextEncoder().encode(body));

    assert.equal(bodySha256, "9d1215b4ce08e5b8c77bccd7c2f673af82d153b1eabea22a1e3c524272b78db1");
  });

  test("vecteur Python officiel - canonical request et signature", () => {
    const body = '{"amount":100,"currency":"USD"}';
    const bodySha256 = computeBodySha256(new TextEncoder().encode(body));
    const canonical = buildCanonicalRequest({
      clientId: CLIENT_ID,
      timestamp: TIMESTAMP,
      nonce: "case-post-json",
      method: "POST",
      path: "/api/invoices/",
      queryString: "status=PAID&page=2",
      bodySha256,
    });

    assert.equal(canonicalizePathAndQuery("/api/invoices/", "status=PAID&page=2"), "/api/invoices/?page=2&status=PAID");
    assert.equal(
      canonical,
      [
        "v1",
        "kisinet-web",
        "1788451200",
        "case-post-json",
        "POST",
        "/api/invoices/?page=2&status=PAID",
        "9d1215b4ce08e5b8c77bccd7c2f673af82d153b1eabea22a1e3c524272b78db1",
      ].join("\n"),
    );
    assert.equal(
      computeHmacSignature(SECRET, canonical),
      "de5e9bec858d3bff076e088955f2125197ce26d0bc2e10088aef843b1ad57429",
    );
  });

  test("cas Python déterministes de query string", () => {
    const cases = [
      ["", "/api/test/"],
      ["a=1&A=1", "/api/test/?A=1&a=1"],
      ["é=1&z=1", "/api/test/?z=1&%C3%A9=1"],
      ["z=1&é=1", "/api/test/?z=1&%C3%A9=1"],
      ["a=2&a=1", "/api/test/?a=1&a=2"],
      ["status=A&status=B", "/api/test/?status=A&status=B"],
      ["status=B&status=A", "/api/test/?status=A&status=B"],
      ["search=", "/api/test/?search="],
      ["space=a%20b&plus=a+b", "/api/test/?plus=a+b&space=a+b"],
      ["slash=%2F&amp=%26&eq=%3D", "/api/test/?amp=%26&eq=%3D&slash=%2F"],
      ["reserved=%21%2A%27%28%29~", "/api/test/?reserved=%21%2A%27%28%29~"],
    ] as const;

    cases.forEach(([queryString, expected]) => {
      assert.equal(canonicalizePathAndQuery("/api/test/", queryString), expected);
    });
  });

  test("vecteurs cross-language supplémentaires", () => {
    const vectors = [
      {
        method: "GET",
        path: "/api/test/",
        queryString: "",
        body: null,
        nonce: "case-get",
        bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        canonicalPath: "/api/test/",
        signature: "dc1e37354b85cad05417b161e7fd99db2414865992e6a7bfa03ed9017447dc36",
      },
      {
        method: "GET",
        path: "/api/test/",
        queryString: "a=1&A=1",
        body: null,
        nonce: "case-upper",
        bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        canonicalPath: "/api/test/?A=1&a=1",
        signature: "e8dfb8ab3477e86d98338540a39eff6c9bc648254bbb89eab2d608d1c8b1c5a3",
      },
      {
        method: "GET",
        path: "/api/test/",
        queryString: "é=1&z=1",
        body: null,
        nonce: "case-unicode1",
        bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        canonicalPath: "/api/test/?z=1&%C3%A9=1",
        signature: "00d4ccbc22839c00f78f808224df9e5301e88e8df6b23639621985238d75651a",
      },
      {
        method: "GET",
        path: "/api/test/",
        queryString: "a=2&a=1&status=A&status=B&search=&space=a%20b&plus=a+b&slash=%2F&amp=%26&eq=%3D",
        body: null,
        nonce: "case-reserved",
        bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        canonicalPath: "/api/test/?a=1&a=2&amp=%26&eq=%3D&plus=a+b&search=&slash=%2F&space=a+b&status=A&status=B",
        signature: "2204284ba429a910f5661ae74794a888084c8ea7ea56c9c33fbda6a2fd863855",
      },
    ] as const;

    vectors.forEach((vector) => {
      const bodySha256 = computeBodySha256(vector.body);
      const canonical = buildCanonicalRequest({
        clientId: CLIENT_ID,
        timestamp: TIMESTAMP,
        nonce: vector.nonce,
        method: vector.method,
        path: vector.path,
        queryString: vector.queryString,
        bodySha256,
      });

      assert.equal(bodySha256, vector.bodySha256);
      assert.equal(canonicalizePathAndQuery(vector.path, vector.queryString), vector.canonicalPath);
      assert.equal(
        canonical,
        ["v1", CLIENT_ID, TIMESTAMP, vector.nonce, vector.method, vector.canonicalPath, vector.bodySha256].join("\n"),
      );
      assert.equal(computeHmacSignature(SECRET, canonical), vector.signature);
    });
  });
});

describe("createHmacHeaders", () => {
  test("génère les headers HMAC attendus depuis les valeurs par défaut", () => {
    const previousSecret = process.env.KISINET_HMAC_SECRET;
    process.env.KISINET_HMAC_SECRET = SECRET;
    process.env.KISINET_HMAC_CLIENT_ID = CLIENT_ID;
    process.env.KISINET_HMAC_SIGNATURE_VERSION = "v1";

    try {
      const headers = createHmacHeaders({
        method: "post",
        path: "/api/invoices/",
        queryString: "status=PAID&page=2",
        bodyBytes: new TextEncoder().encode('{"amount":100,"currency":"USD"}'),
        timestamp: TIMESTAMP,
        nonce: "case-post-json",
      });

      assert.equal(headers.get("X-Kisinet-Client-Id"), CLIENT_ID);
      assert.equal(headers.get("X-Kisinet-Timestamp"), TIMESTAMP);
      assert.equal(headers.get("X-Kisinet-Nonce"), "case-post-json");
      assert.equal(headers.get("X-Kisinet-Content-SHA256"), "9d1215b4ce08e5b8c77bccd7c2f673af82d153b1eabea22a1e3c524272b78db1");
      assert.equal(headers.get("X-Kisinet-Signature-Version"), "v1");
      assert.equal(headers.get("X-Kisinet-Signature"), "de5e9bec858d3bff076e088955f2125197ce26d0bc2e10088aef843b1ad57429");
    } finally {
      process.env.KISINET_HMAC_SECRET = previousSecret;
    }
  });

  test("timestamp Unix et nonce unique à chaque appel", () => {
    const previousSecret = process.env.KISINET_HMAC_SECRET;
    process.env.KISINET_HMAC_SECRET = SECRET;

    try {
      const before = Math.floor(Date.now() / 1000);
      const first = createHmacHeaders({ method: "GET", path: "/api/test/" });
      const second = createHmacHeaders({ method: "GET", path: "/api/test/" });
      const after = Math.floor(Date.now() / 1000);

      const timestamp = Number(first.get("X-Kisinet-Timestamp"));
      assert.ok(Number.isInteger(timestamp));
      assert.ok(timestamp >= before);
      assert.ok(timestamp <= after);
      assert.notEqual(first.get("X-Kisinet-Nonce"), second.get("X-Kisinet-Nonce"));
      assert.notEqual(first.get("X-Kisinet-Signature"), second.get("X-Kisinet-Signature"));
    } finally {
      process.env.KISINET_HMAC_SECRET = previousSecret;
    }
  });
});
