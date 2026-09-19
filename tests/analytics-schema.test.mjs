import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const migrationsDir = new URL("../supabase/migrations/", import.meta.url);

/**
 * Migrations are looked up by name rather than by full filename. Their version
 * prefixes get realigned whenever Supabase applies them under a different
 * timestamp, and a hardcoded prefix turns that rename into a test failure.
 */
async function readMigration(name) {
  const files = await readdir(migrationsDir);
  const match = files.find((file) => file.endsWith(`_${name}.sql`));

  assert.ok(match, `no migration found for ${name}`);
  return readFile(new URL(match, migrationsDir), "utf8");
}

const migration = await readMigration("add_first_party_analytics");
const retireMigration = await readMigration("retire_analytics_admins");

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
