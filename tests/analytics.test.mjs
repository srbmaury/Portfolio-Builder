import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAnalyticsEventInput,
  summarizeAnalytics,
} from "../lib/analytics.ts";

const portfolios = [
  { id: "11111111-1111-4111-8111-111111111111", variantKey: "backend", name: "Backend", isPublished: true },
  { id: "22222222-2222-4222-8222-222222222222", variantKey: "ai", name: "AI", isPublished: true },
];

const events = [
  {
    portfolio_id: portfolios[0].id,
    event_type: "portfolio_view",
    visitor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    session_id: "aaaaaaaa-0000-4000-8000-000000000001",
    target: null,
    referrer_host: "linkedin.com",
    device_type: "desktop",
    created_at: "2026-09-18T05:00:00.000Z",
  },
  {
    portfolio_id: portfolios[0].id,
    event_type: "portfolio_view",
    visitor_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    session_id: "bbbbbbbb-0000-4000-8000-000000000001",
    target: null,
    referrer_host: "x.com",
    device_type: "mobile",
    created_at: "2026-09-18T06:00:00.000Z",
  },
  {
    portfolio_id: portfolios[0].id,
    event_type: "resume_opened",
    visitor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    session_id: "aaaaaaaa-0000-4000-8000-000000000001",
    target: "resume",
    referrer_host: "linkedin.com",
    device_type: "desktop",
    created_at: "2026-09-18T05:02:00.000Z",
  },
  {
    portfolio_id: portfolios[0].id,
    event_type: "project_clicked",
    visitor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    session_id: "aaaaaaaa-0000-4000-8000-000000000001",
    target: "project:github",
    referrer_host: "linkedin.com",
    device_type: "desktop",
    created_at: "2026-09-18T05:03:00.000Z",
  },
  {
    portfolio_id: portfolios[1].id,
    event_type: "portfolio_view",
    visitor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    session_id: "aaaaaaaa-0000-4000-8000-000000000002",
    target: null,
    referrer_host: "",
    device_type: "desktop",
    created_at: "2026-09-17T05:00:00.000Z",
  },
  {
    portfolio_id: portfolios[1].id,
    event_type: "contact_clicked",
    visitor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    session_id: "aaaaaaaa-0000-4000-8000-000000000002",
    target: "email",
    referrer_host: "",
    device_type: "desktop",
    created_at: "2026-09-17T05:01:00.000Z",
  },
];

test("analytics event input accepts only fixed non-content fields", () => {
  const result = normalizeAnalyticsEventInput({
    portfolioId: portfolios[0].id,
    eventType: "project_clicked",
    visitorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sessionId: "aaaaaaaa-0000-4000-8000-000000000001",
    target: "project:github",
    referrerHost: "LinkedIn.COM",
    deviceType: "desktop",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value, {
    portfolioId: portfolios[0].id,
    eventType: "project_clicked",
    visitorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sessionId: "aaaaaaaa-0000-4000-8000-000000000001",
    target: "project:github",
    referrerHost: "linkedin.com",
    deviceType: "desktop",
  });
});

test("analytics event input rejects arbitrary text targets and unsupported event types", () => {
  const badTarget = normalizeAnalyticsEventInput({
    portfolioId: portfolios[0].id,
    eventType: "project_clicked",
    visitorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sessionId: "aaaaaaaa-0000-4000-8000-000000000001",
    target: "My secret project title with spaces",
    referrerHost: "",
    deviceType: "mobile",
  });
  assert.equal(badTarget.ok, false);

  const badType = normalizeAnalyticsEventInput({
    portfolioId: portfolios[0].id,
    eventType: "resume_text_copied",
    visitorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sessionId: "aaaaaaaa-0000-4000-8000-000000000001",
    target: "",
    referrerHost: "",
    deviceType: "mobile",
  });
  assert.equal(badType.ok, false);
});

test("analytics summary calculates views, unique and engaged visitors", () => {
  const result = summarizeAnalytics(events, portfolios);

  assert.equal(result.summary.views, 3);
  assert.equal(result.summary.uniqueVisitors, 2);
  assert.equal(result.summary.engagedVisitors, 1);
  assert.equal(result.summary.engagementRate, 50);
  assert.equal(result.summary.resumeOpens, 1);
  assert.equal(result.summary.resumeOpenRate, 50);
  assert.equal(result.summary.contactClicks, 1);
  assert.equal(result.summary.contactClickRate, 50);
  assert.equal(result.summary.projectClicks, 1);
  assert.equal(result.summary.projectClickRate, 50);
  assert.equal(result.summary.socialClicks, 0);
});

test("analytics summary groups daily trend, referrers, devices and actions", () => {
  const result = summarizeAnalytics(events, portfolios);

  assert.deepEqual(result.daily, [
    { date: "2026-09-17", views: 1, uniqueVisitors: 1, engagements: 1 },
    { date: "2026-09-18", views: 2, uniqueVisitors: 2, engagements: 2 },
  ]);
  assert.deepEqual(result.referrers, [
    { label: "linkedin.com", count: 1 },
    { label: "x.com", count: 1 },
    { label: "Direct", count: 1 },
  ]);
  assert.deepEqual(result.devices, [
    { label: "desktop", count: 2 },
    { label: "mobile", count: 1 },
  ]);
  assert.deepEqual(result.actions, [
    { label: "Project clicks", count: 1 },
    { label: "Resume opens", count: 1 },
    { label: "Contact clicks", count: 1 },
  ]);
});

test("analytics summary connects traffic sources to downstream actions", () => {
  const result = summarizeAnalytics(events, portfolios);

  assert.deepEqual(result.sourcePerformance, [
    {
      label: "linkedin.com",
      visitors: 1,
      resumeOpenVisitors: 1,
      projectClickVisitors: 1,
      contactClickVisitors: 0,
    },
    {
      label: "x.com",
      visitors: 1,
      resumeOpenVisitors: 0,
      projectClickVisitors: 0,
      contactClickVisitors: 0,
    },
    {
      label: "Direct",
      visitors: 1,
      resumeOpenVisitors: 0,
      projectClickVisitors: 0,
      contactClickVisitors: 1,
    },
  ]);
});

test("analytics summary exposes per-portfolio performance", () => {
  const result = summarizeAnalytics(events, portfolios);

  assert.deepEqual(
    result.portfolios.map(({ variantKey, views, uniqueVisitors, engagedVisitors }) => ({
      variantKey,
      views,
      uniqueVisitors,
      engagedVisitors,
    })),
    [
      { variantKey: "backend", views: 2, uniqueVisitors: 2, engagedVisitors: 1 },
      { variantKey: "ai", views: 1, uniqueVisitors: 1, engagedVisitors: 1 },
    ]
  );
});

test("tagged share links are accepted, normalized, and labelled", async () => {
  const { normalizeAnalyticsEventInput } = await import("../lib/analytics.ts");
  const { normalizeShareTag, sourceLabel, taggedShareUrl } = await import(
    "../lib/share-links.ts"
  );
  const base = {
    portfolioId: "6f1c1c1e-1d2b-4c1a-9a3e-1b2c3d4e5f60",
    visitorId: "6f1c1c1e-1d2b-4c1a-9a3e-1b2c3d4e5f61",
    sessionId: "6f1c1c1e-1d2b-4c1a-9a3e-1b2c3d4e5f62",
    eventType: "portfolio_view",
    deviceType: "desktop",
  };

  assert.equal(
    normalizeAnalyticsEventInput({ ...base, referrerHost: "via:linkedin" }).ok,
    true
  );
  assert.equal(
    normalizeAnalyticsEventInput({ ...base, referrerHost: "via:<script>" }).ok,
    false
  );
  assert.equal(normalizeShareTag("  Acme Corp — Application! "), "acme-corp-application");
  assert.equal(normalizeShareTag("***"), "");
  assert.equal(sourceLabel("via:linkedin"), "LinkedIn (your link)");
  assert.equal(sourceLabel("via:acme-application"), "Acme Application (your link)");
  assert.equal(sourceLabel("github.com"), "github.com");
  assert.equal(
    taggedShareUrl("https://devfoliox.srbmaury.com/a/b", "Résumé"),
    "https://devfoliox.srbmaury.com/a/b?via=resume"
  );
});
