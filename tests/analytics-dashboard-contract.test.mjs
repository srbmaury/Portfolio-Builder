import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(
  new URL("../app/analytics/page.tsx", import.meta.url),
  "utf8"
);
const store = await readFile(
  new URL("../lib/supabase/analytics-store.ts", import.meta.url),
  "utf8"
);
const manager = await readFile(
  new URL("../components/PortfolioManager.tsx", import.meta.url),
  "utf8"
);
const dashboard = await readFile(
  new URL("../components/AnalyticsDashboard.tsx", import.meta.url),
  "utf8"
);

test("creator analytics requires authentication and uses owner-scoped Supabase data", () => {
  assert.match(page, /redirect\("\/login"\)/);
  assert.match(store, /analytics_events/);
  assert.match(store, /user_id/);
  assert.match(store, /summarizeAnalytics/);
});

test("creator analytics supports 7, 30, and 90 day windows", () => {
  assert.match(dashboard, /\[7, 30, 90\]/);
  assert.match(page, /normalizeAnalyticsDays/);
});

test("portfolio manager links users to first-party analytics", () => {
  assert.match(manager, /\/analytics/);
});
