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
  assert.ok(
    portfolioDeleteIndex > cloudinaryIndex,
    "database portfolio row should be deleted only after remote cleanup"
  );
});
