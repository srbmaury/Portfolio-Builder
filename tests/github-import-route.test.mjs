import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../app/api/github/repositories/route.ts", import.meta.url),
  "utf8"
);

test("GitHub import uses a fixed public repository endpoint", () => {
  assert.match(route, /https:\/\/api\.github\.com\/users\/\$\{encodeURIComponent\(username\)\}\/repos/);
  assert.match(route, /USERNAME_PATTERN/);
  assert.match(route, /type=owner/);
  assert.match(route, /per_page=100/);
});

test("GitHub import token remains server-only", () => {
  assert.match(route, /process\.env\.GITHUB_TOKEN/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_GITHUB_TOKEN/);
  assert.doesNotMatch(route, /GITHUB_TOKEN[^\n]*NextResponse\.json/);
});

test("GitHub import caches public responses and handles rate limits", () => {
  assert.match(route, /revalidate: 300/);
  assert.match(route, /response\.status === 403 \|\| response\.status === 429/);
  assert.match(route, /Cache-Control/);
});
