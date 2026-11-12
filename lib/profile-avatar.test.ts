import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("le profil normalise avatar_url et les pages affichent un fallback sur erreur", () => {
  const api = source("lib/api.ts");
  const profilePage = source("app/app/profile/page.tsx");
  const accountPage = source("app/app/compte/page.tsx");

  assert.match(api, /avatarUrl\?: string/);
  assert.match(api, /avatarUrl: getText\(item\.avatar_url\)/);
  for (const page of [profilePage, accountPage]) {
    assert.match(page, /profile\.avatarUrl/);
    assert.match(page, /onError=\{\(\) => setImageFailed\(true\)\}/);
    assert.match(page, /getInitials\(profile\)/);
  }
});
