import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const docs = await readFile(
  new URL("../app/docs/page.tsx", import.meta.url),
  "utf8"
);
const home = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8"
);
const readme = await readFile(
  new URL("../README.md", import.meta.url),
  "utf8"
);

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public docs describe the current feature set", () => {
  assert.match(docs, /Resume import/);
  assert.match(docs, /JSON editor/);
  assert.match(docs, /custom sections/i);
  assert.match(docs, /First-party analytics/);
  assert.match(docs, /Account deletion/);
});

test("docs are discoverable from the site and repository", () => {
  assert.match(home, /href="\/docs"/);
  assert.match(readme, /\/docs/);
});

test("auth email runbook documents API-hook secrets and rollback", async () => {
  const runbook = await readProjectFile("docs/auth-email-runbook.md");

  for (const key of [
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
    "BREVO_SENDER_NAME",
    "SEND_EMAIL_HOOK_SECRET",
  ]) {
    assert.match(runbook, new RegExp(key));
  }
  assert.match(runbook, /BREVO_WEBHOOK_SECRET.*not.*hook/i);
  assert.match(runbook, /disable.*Send Email Hook/i);
  assert.match(runbook, /keep.*SMTP.*live/i);
});

test("send-email function disables platform JWT verification", async () => {
  const config = await readProjectFile("supabase/config.toml");

  assert.match(
    config,
    /\[functions\.send-email\][\s\S]*?verify_jwt\s*=\s*false/,
  );
});
