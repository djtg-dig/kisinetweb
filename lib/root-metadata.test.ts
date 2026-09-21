import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(projectRoot, path), "utf8");
}

describe("root metadata favicons", () => {
  test("expose un favicon ICO et un favicon PNG carré", () => {
    const source = readProjectFile("app/layout.tsx");

    assert.ok(source.includes('url: "/favicon.ico"'));
    assert.ok(source.includes('url: "/favicon-96x96.png"'));
    assert.ok(source.includes('type: "image/png"'));
    assert.ok(source.includes('sizes: "96x96"'));
  });
});
