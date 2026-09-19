import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const functionSource = await readFile(
  new URL("../supabase/functions/delete-account/index.ts", import.meta.url),
  "utf8"
);
const accountCleanupSource = await readFile(
  new URL("../app/api/account/assets/route.ts", import.meta.url),
  "utf8"
);
const portfolioDeleteSource = await readFile(
  new URL("../app/api/portfolios/[variantKey]/route.ts", import.meta.url),
  "utf8"
);

test("account deletion cleans Cloudinary assets before deleting the auth user", () => {
  const cleanupIndex = functionSource.indexOf("/api/account/assets");
  const authDeleteIndex = functionSource.indexOf("auth.admin.deleteUser");

  assert.ok(cleanupIndex >= 0, "delete-account must call the cleanup endpoint");
  assert.ok(authDeleteIndex > cleanupIndex, "auth user deletion must happen after asset cleanup");
});

test("account cleanup accepts an authenticated bearer token for backend orchestration", () => {
  assert.match(accountCleanupSource, /authorization.*Bearer/s);
  assert.match(accountCleanupSource, /auth\.getUser\(bearerToken \|\| undefined\)/);
  assert.match(accountCleanupSource, /cloudinaryUserTag\(user\.id\)/);
});

test("portfolio deletion considers published snapshots and removes target-only content", () => {
  assert.match(portfolioDeleteSource, /published_snapshot/);
  assert.match(portfolioDeleteSource, /selectOrphanedTargetContent/);
  assert.match(portfolioDeleteSource, /destroyCloudinaryUrls\(deletable\)/);

  const cloudinaryIndex = portfolioDeleteSource.indexOf("destroyCloudinaryUrls(deletable)");
  const portfolioDeleteIndex = portfolioDeleteSource.indexOf('.from("portfolios")\n      .delete()');

  assert.ok(cloudinaryIndex >= 0);
  // This order was deliberately reversed. Destroying assets first guaranteed
  // no orphaned uploads, but it made an irreversible remote deletion depend on
  // database work that could still fail: a permissions error left the
  // portfolio in place with its images permanently gone. The `deletable` list
  // is computed before either step, so deleting the row first does not lose
  // track of the assets. Orphaned files cost storage; destroyed files cannot
  // be recovered, so the failure mode now favours keeping the files.
  assert.ok(
    cloudinaryIndex > portfolioDeleteIndex,
    "assets should only be destroyed once the portfolio row is gone"
  );
});


test("portfolio deletion also cleans creator product events", () => {
  assert.match(portfolioDeleteSource, /from\("product_events"\)/);
  assert.match(portfolioDeleteSource, /eq\("variant_key", variantKey\)/);
  assert.match(portfolioDeleteSource, /delete\(\)\.eq\("user_id", user\.id\)/);
});
