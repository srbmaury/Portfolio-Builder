import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260918153505_atomic_workspace_save_and_product_analytics.sql",
    import.meta.url
  ),
  "utf8"
);
const deleteMigration = await readFile(
  new URL(
    "../supabase/migrations/20260919130000_transactional_portfolio_deletion.sql",
    import.meta.url
  ),
  "utf8"
);
const store = await readFile(
  new URL("../lib/supabase/portfolio-store.ts", import.meta.url),
  "utf8"
);
const productRoute = await readFile(
  new URL("../app/api/product-analytics/events/route.ts", import.meta.url),
  "utf8"
);
const publicPage = await readFile(
  new URL("../app/[username]/[portfolio]/page.tsx", import.meta.url),
  "utf8"
);
const renderer = await readFile(
  new URL("../components/PortfolioRenderer.tsx", import.meta.url),
  "utf8"
);
const sitemap = await readFile(
  new URL("../app/sitemap.ts", import.meta.url),
  "utf8"
);

test("workspace persistence is performed through one RLS-aware database function", () => {
  assert.match(migration, /function public\.save_portfolio_workspace\(payload jsonb\)/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(
    migration,
    /revoke execute on function public\.save_portfolio_workspace\(jsonb\)[\s\S]*from public, anon/i
  );
  assert.match(
    migration,
    /grant execute on function public\.save_portfolio_workspace\(jsonb\)[\s\S]*to authenticated, service_role/i
  );
  assert.match(store, /\.rpc\("save_portfolio_workspace"/);
});

test("portfolio deletion is also one RLS-aware database transaction", () => {
  assert.match(
    deleteMigration,
    /function public\.delete_portfolio_workspace\(p_variant_key text\)/i
  );
  assert.match(deleteMigration, /security invoker/i);
  assert.match(deleteMigration, /auth\.uid\(\)/i);
  assert.match(deleteMigration, /delete from public\.portfolios/i);
  assert.match(deleteMigration, /delete from public\.product_events/i);
});

test("creator product analytics are authenticated and content-free", () => {
  assert.match(migration, /create table if not exists public\.product_events/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /for insert[\s\S]*to authenticated[\s\S]*auth\.uid\(\)/i);
  assert.match(
    migration,
    /revoke all on table public\.product_events from authenticated/i
  );
  assert.match(
    migration,
    /grant insert on table public\.product_events to authenticated/i
  );
  assert.match(productRoute, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(productRoute, /profile|resume text|project description/i);
});

test("public portfolios expose discoverability and accessibility primitives", () => {
  assert.match(publicPage, /application\/ld\+json/);
  assert.match(publicPage, /"@type": "ProfilePage"/);
  assert.match(publicPage, /robots:[\s\S]*index: true[\s\S]*follow: true/);
  assert.match(renderer, /className="skip-link"/);
  assert.match(renderer, /href="#portfolio-main"/);
  assert.match(sitemap, /public_path/);
});
