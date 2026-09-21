import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const authConfig = await readFile(
  new URL("../supabase/config.toml", import.meta.url),
  "utf8"
);
const deleteAccount = await readFile(
  new URL("../supabase/functions/delete-account/index.ts", import.meta.url),
  "utf8"
);

test("Supabase auth uses the public DevFolioX domain", () => {
  assert.match(authConfig, /site_url = "https:\/\/devfoliox\.qd\.je"/);
  assert.match(authConfig, /"https:\/\/devfoliox\.qd\.je\/\*\*"/);
  assert.doesNotMatch(authConfig, /portfolio-builder-miia\.onrender\.com/);
});

test("account deletion falls back to the public DevFolioX domain", () => {
  assert.match(
    deleteAccount,
    /https:\/\/devfoliox\.qd\.je\/api\/account\/assets/
  );
  assert.doesNotMatch(deleteAccount, /portfolio-builder-miia\.onrender\.com/);
});
