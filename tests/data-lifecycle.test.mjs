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
const transactionalDeleteSource = await readFile(
  new URL(
    "../supabase/migrations/20260919044326_transactional_portfolio_deletion.sql",
    import.meta.url
  ),
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

test("portfolio deletion considers published snapshots and removes target-only content atomically", () => {
  assert.match(portfolioDeleteSource, /published_snapshot/);
  assert.match(portfolioDeleteSource, /selectOrphanedTargetContent/);
  assert.match(portfolioDeleteSource, /delete_portfolio_workspace/);
  assert.match(transactionalDeleteSource, /v_orphaned_experience_ids/);
  assert.match(transactionalDeleteSource, /v_orphaned_project_ids/);
  assert.match(transactionalDeleteSource, /v_orphaned_skills/);

  const rpcIndex = portfolioDeleteSource.indexOf('"delete_portfolio_workspace"');
  const cloudinaryIndex = portfolioDeleteSource.indexOf(
    "destroyCloudinaryUrls(deletable)"
  );

  assert.ok(rpcIndex >= 0);
  assert.ok(
    cloudinaryIndex > rpcIndex,
    "external assets should only be destroyed after the database transaction commits"
  );
});

test("portfolio deletion also cleans creator product events inside the transaction", () => {
  assert.match(
    transactionalDeleteSource,
    /delete from public\.product_events[\s\S]*variant_key = p_variant_key/
  );
  assert.match(
    transactionalDeleteSource,
    /delete from public\.product_events[\s\S]*where user_id = v_user_id/
  );
});
