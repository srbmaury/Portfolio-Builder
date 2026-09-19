import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260919044326_transactional_portfolio_deletion.sql",
    import.meta.url
  ),
  "utf8"
);
const route = await readFile(
  new URL("../app/api/portfolios/[variantKey]/route.ts", import.meta.url),
  "utf8"
);

test("transactional delete RPC is RLS-aware and restricted to authenticated callers", () => {
  assert.match(
    migration,
    /function public\.delete_portfolio_workspace\(p_variant_key text\)/i
  );
  assert.match(migration, /security invoker/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/i);
  assert.match(
    migration,
    /revoke execute on function public\.delete_portfolio_workspace\(text\)[\s\S]*from public, anon/i
  );
  assert.match(
    migration,
    /grant execute on function public\.delete_portfolio_workspace\(text\)[\s\S]*to authenticated, service_role/i
  );
});

test("product_events cleanup has the minimum privileges required by the RPC", () => {
  assert.match(
    migration,
    /grant select \(user_id, variant_key\) on table public\.product_events to authenticated/i
  );
  assert.match(
    migration,
    /grant delete on table public\.product_events to authenticated/i
  );
  assert.match(
    migration,
    /create policy product_events_owner_delete[\s\S]*using \(\(select auth\.uid\(\)\) = user_id\)/i
  );
  assert.doesNotMatch(
    migration,
    /grant select on table public\.product_events to (anon|authenticated)/i
  );
});

test("portfolio database deletion is performed by one RPC instead of independent deletes", () => {
  assert.match(
    route,
    /\.rpc\(\s*"delete_portfolio_workspace",[\s\S]*p_variant_key: variantKey/
  );
  assert.doesNotMatch(route, /from\("experiences"\)\.delete\(/);
  assert.doesNotMatch(route, /from\("projects"\)\.delete\(/);
  assert.doesNotMatch(route, /from\("skills"\)\.delete\(/);
  assert.doesNotMatch(route, /from\("profiles"\)\.delete\(/);
  assert.doesNotMatch(route, /from\("portfolios"\)\s*\.delete\(/);
  assert.doesNotMatch(route, /from\("product_events"\)\s*\.delete\(/);
});

test("assets are destroyed only after the transactional database RPC succeeds", () => {
  const rpc = route.indexOf('"delete_portfolio_workspace"');
  const errorGuard = route.indexOf("if (deleteError) throw deleteError");
  const destroy = route.indexOf("await destroyCloudinaryUrls(deletable)");

  assert.ok(rpc > 0, "expected the transactional delete RPC");
  assert.ok(errorGuard > rpc, "RPC errors must abort external cleanup");
  assert.ok(
    destroy > errorGuard,
    "destroyCloudinaryUrls must run only after the database RPC succeeds"
  );
});

test("transactional deletion removes target-only content and product events", () => {
  assert.match(migration, /v_orphaned_experience_ids/);
  assert.match(migration, /v_orphaned_project_ids/);
  assert.match(migration, /v_orphaned_skills/);
  assert.match(migration, /delete from public\.experiences/);
  assert.match(migration, /delete from public\.projects/);
  assert.match(migration, /delete from public\.skills/);
  assert.match(migration, /delete from public\.product_events/);
  assert.match(migration, /delete from public\.portfolios/);
});

test("portfolio delete still surfaces Supabase errors", () => {
  assert.match(route, /function errorMessage\(/);
  assert.match(route, /typeof message === "string"/);
  assert.match(route, /errorMessage\(error, "Portfolio deletion failed\."\)/);
});
