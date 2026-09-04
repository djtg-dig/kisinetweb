import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

test("aucun Client Component n'importe les modules serveur HMAC/BFF", () => {
  const files = listSourceFiles(["app", "components", "lib"]);

  const violations = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    const firstStatements = source.slice(0, 300);
    const isClientComponent = /['"]use client['"]/.test(firstStatements);
    const importsServerModule =
      /@\/lib\/server\/(?:hmac|backend-fetch|backend-url)/.test(source) ||
      /from ['"].*lib\/server\/(?:hmac|backend-fetch|backend-url)['"]/.test(source);

    return isClientComponent && importsServerModule;
  });

  assert.deepEqual(
    violations.map((file) => relative(process.cwd(), file)),
    [],
  );
});

function listSourceFiles(directories: string[]): string[] {
  const files: string[] = [];

  directories.forEach((directory) => {
    readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        files.push(...listSourceFiles([fullPath]));
        return;
      }

      if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    });
  });

  return files;
}
