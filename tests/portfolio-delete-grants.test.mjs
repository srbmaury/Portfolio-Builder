import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const grantFix = await readFile(
  new URL(
    "../supabase/migrations/20260919123000_fix_product_events_delete_grant.sql",
    import.meta.url
  ),
  "utf8"
);
const route = await readFile(
  new URL("../app/api/portfolios/[variantKey]/route.ts", import.meta.url),
  "utf8"
);

test("product_events cleanup can evaluate its WHERE clause", () => {
  // DELETE ... WHERE user_id = $1 AND variant_key = $2 needs SELECT privilege
  // on the filtered columns, or Postgres raises 42501 and the whole portfolio
  // delete returns 500.
  assert.match(
    grantFix,
    /grant select \(user_id, variant_key\) on table public\.product_events to authenticated/i
  );
  assert.match(
    grantFix,
    /grant delete on table public\.product_events to authenticated/i
  );
});

test("the grant fix re-asserts the owner delete policy idempotently", () => {
  assert.match(
    grantFix,
    /drop policy if exists product_events_owner_delete on public\.product_events/i
  );
  assert.match(grantFix, /create policy product_events_owner_delete/i);
  assert.match(grantFix, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
});

test("the grant fix does not expose event rows for reading", () => {
  // A column grant is enough for the filter; a SELECT policy would let clients
  // read other people's product events.
  assert.doesNotMatch(grantFix, /for select/i);
  assert.doesNotMatch(
    grantFix,
    /grant select on table public\.product_events to (anon|authenticated)/i
  );
});

test("portfolio delete surfaces Supabase errors instead of swallowing them", () => {
  // Supabase rejects with a plain object, so an instanceof Error check alone
  // discarded the cause and every failure looked identical.
  assert.match(route, /function errorMessage\(/);
  assert.match(route, /typeof message === "string"/);
  assert.match(route, /errorMessage\(error, "Portfolio deletion failed\."\)/);
});

test("assets are destroyed only after the database work succeeds", () => {
  // Destroying Cloudinary assets cannot be undone. Running it before the
  // fallible database work meant a failed delete left the portfolio in place
  // with its images permanently gone.
  const destroy = route.indexOf("await destroyCloudinaryUrls(deletable)");
  const rowDelete = route.indexOf('.from("portfolios")\n      .delete()');
  const deleteGuard = route.indexOf("if (deleteError) throw deleteError");

  assert.ok(destroy > 0, "expected the asset destruction call");
  assert.ok(rowDelete > 0, "expected the portfolio row delete");
  assert.ok(
    destroy > deleteGuard && deleteGuard > rowDelete,
    "destroyCloudinaryUrls must run after the portfolio row is deleted"
  );
});

test("product analytics cleanup cannot block deleting a portfolio", () => {
  // variant_key is plain text, not a foreign key, so these rows do not
  // cascade; but a permissions failure here must not abort the delete.
  const rowDelete = route.indexOf("if (deleteError) throw deleteError");
  const productCleanup = route.indexOf('.from("product_events")');

  assert.ok(
    productCleanup > rowDelete,
    "product_events cleanup must run after the portfolio row is deleted"
  );
  assert.match(route, /if \(productEventsError\) \{\s*\n\s*console\.warn/);
  assert.match(route, /productEventsCleaned: !productEventsError/);
  // It must never be rethrown.
  assert.doesNotMatch(route, /throw productEventsError/);
});
