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
