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
const helper = await readFile(
  new URL("../lib/admin.ts", import.meta.url),
  "utf8"
);

test("admin analytics page gates on the configured ADMIN_EMAIL", () => {
  assert.match(page, /isAdminEmail\(/);
  assert.match(page, /notFound\(\)|redirect\(/);
  // The address must never be resolved client-side.
  assert.doesNotMatch(page, /NEXT_PUBLIC_ADMIN_EMAIL/);
});

test("admin email helper fails closed and compares case-insensitively", () => {
  assert.match(helper, /ADMIN_EMAIL/);
  assert.match(helper, /toLowerCase\(\)/);
  // No configured address means nobody is an admin.
  assert.match(helper, /if \(!admin\) return false;/);
  // The address is read server-side only, never from a client-exposed var.
  assert.match(helper, /process\.env\.ADMIN_EMAIL/);
  assert.doesNotMatch(helper, /process\.env\.NEXT_PUBLIC_/);
});

test("admin analytics edge function verifies the caller before service-role aggregation", () => {
  const userLookup = fn.indexOf("auth.getUser");
  const adminLookup = fn.indexOf("isAdminEmail(user.email)");
  const serviceRoleClient = fn.indexOf("serviceRoleKey, {");
  const analyticsLookup = fn.indexOf("analytics_events");

  assert.ok(userLookup >= 0);
  assert.ok(adminLookup > userLookup);
  // Service-role access is only constructed once the caller is proven admin.
  assert.ok(serviceRoleClient > adminLookup);
  assert.ok(analyticsLookup > adminLookup);
});

test("admin analytics edge function reads ADMIN_EMAIL and fails closed", () => {
  assert.match(fn, /Deno\.env\.get\("ADMIN_EMAIL"\)/);
  assert.match(fn, /if \(!admin\) return false;/);
  assert.match(fn, /status: 403/);
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
