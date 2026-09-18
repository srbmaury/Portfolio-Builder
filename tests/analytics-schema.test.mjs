import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20260918143237_add_first_party_analytics.sql", import.meta.url),
  "utf8"
);

const retireMigration = await readFile(
  new URL("../supabase/migrations/20260919120000_retire_analytics_admins.sql", import.meta.url),
  "utf8"
);

test("analytics schema enables RLS and restricts public inserts to published portfolios", () => {
  assert.match(migration, /create table(?: if not exists)? public\.analytics_events/i);
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

test("the analytics_admins allowlist is retired in favour of ADMIN_EMAIL", () => {
  // The original migration created the table; a later one drops it. Admin
  // access is now decided solely by the ADMIN_EMAIL environment variable, so
  // the schema must not leave a second source of authorisation behind.
  assert.match(migration, /create table(?: if not exists)? public\.analytics_admins/i);
  assert.match(retireMigration, /drop table if exists public\.analytics_admins/i);
  assert.match(retireMigration, /revoke all on table public\.analytics_admins from anon, authenticated/i);
  assert.match(retireMigration, /drop policy if exists[\s\S]*on public\.analytics_admins/i);
});
