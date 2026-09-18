import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260918150000_add_first_party_analytics.sql", import.meta.url),
  "utf8"
);

test("analytics schema enables RLS and restricts public inserts to published portfolios", () => {
  assert.match(migration, /create table public\.analytics_events/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /for insert[\s\S]*to anon, authenticated[\s\S]*is_published = true/i);
});

test("analytics schema only lets owners select their portfolio events", () => {
  assert.match(
    migration,
    /for select[\s\S]*to authenticated[\s\S]*p\.user_id = \(select auth\.uid\(\)\)/i
  );
});

test("analytics schema de-duplicates portfolio views per session", () => {
  assert.match(
    migration,
    /unique[\s\S]*portfolio_id[\s\S]*session_id[\s\S]*where event_type = 'portfolio_view'/i
  );
});

test("admin allowlist uses auth user ids and cannot be modified by normal users", () => {
  assert.match(migration, /create table public\.analytics_admins/i);
  assert.match(migration, /references auth\.users\(id\) on delete cascade/i);
  assert.match(migration, /revoke insert, update, delete on public\.analytics_admins from anon, authenticated/i);
});
