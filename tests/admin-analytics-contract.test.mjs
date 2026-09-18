import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(
  new URL("../app/admin/analytics/page.tsx", import.meta.url),
  "utf8"
);
const fn = await readFile(
  new URL("../supabase/functions/admin-analytics/index.ts", import.meta.url),
  "utf8"
);

test("admin analytics page verifies explicit admin membership", () => {
  assert.match(page, /analytics_admins/);
  assert.match(page, /notFound\(\)|redirect\(/);
});

test("admin analytics edge function verifies the caller before service-role aggregation", () => {
  const userLookup = fn.indexOf("auth.getUser");
  const adminLookup = fn.indexOf("analytics_admins");
  const analyticsLookup = fn.indexOf("analytics_events");

  assert.ok(userLookup >= 0);
  assert.ok(adminLookup > userLookup);
  assert.ok(analyticsLookup > adminLookup);
});

test("admin analytics reports product usage without exposing portfolio content", () => {
  for (const metric of [
    "totalUsers",
    "totalPortfolios",
    "publishedPortfolios",
    "views",
    "uniqueVisitors",
  ]) {
    assert.ok(fn.includes(metric), `missing admin metric ${metric}`);
  }

  assert.doesNotMatch(fn, /resume_text|about|tagline|description/i);
});
