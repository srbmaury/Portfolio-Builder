import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(
  new URL("../app/[username]/[portfolio]/page.tsx", import.meta.url),
  "utf8"
);
const renderer = await readFile(
  new URL("../components/PortfolioRenderer.tsx", import.meta.url),
  "utf8"
);
const tracker = await readFile(
  new URL("../components/PortfolioAnalyticsTracker.tsx", import.meta.url),
  "utf8"
);
const route = await readFile(
  new URL("../app/api/analytics/events/route.ts", import.meta.url),
  "utf8"
);

test("public portfolio mounts first-party analytics tracker using portfolio id", () => {
  assert.match(page, /PortfolioAnalyticsTracker/);
  assert.match(page, /portfolioId=/);
});

test("renderer marks high-signal visitor actions instead of every button", () => {
  for (const event of [
    "resume_opened",
    "contact_clicked",
    "project_clicked",
    "social_clicked",
  ]) {
    assert.ok(renderer.includes(event), `missing ${event} instrumentation`);
  }
});

test("tracker delegates click tracking and stores anonymous ids locally", () => {
  assert.match(tracker, /localStorage/);
  assert.match(tracker, /sessionStorage/);
  assert.match(tracker, /closest\(/);
  assert.match(tracker, /portfolio_view/);
  assert.match(tracker, /doNotTrack/);
});

test("analytics endpoint validates input and inserts fixed fields only", () => {
  assert.match(route, /normalizeAnalyticsEventInput/);
  assert.match(route, /analytics_events/);
  assert.doesNotMatch(route, /email|resumeText|description|profile/i);
});
