import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultBranding,
  emptyBuilderState,
  normalizeBuilderState,
  snapshotForVariant,
} from "../lib/portfolio.ts";

test("new portfolio variants start with per-portfolio brand and sharing settings", () => {
  assert.deepEqual(emptyBuilderState.variants[0].branding, defaultBranding);
});

test("older saved variants without branding receive safe defaults", () => {
  const legacy = structuredClone(emptyBuilderState);
  delete legacy.variants[0].branding;

  const normalized = normalizeBuilderState(legacy);

  assert.deepEqual(normalized.variants[0].branding, defaultBranding);
});

test("published snapshots carry the active portfolio sharing settings", () => {
  const state = structuredClone(emptyBuilderState);
  state.data.profile.name = "Saurabh Maurya";
  state.variants[0].name = "Backend & Platform";
  state.variants[0].branding = {
    faviconUrl: "https://res.cloudinary.com/demo/image/upload/favicon.png",
    shareTitle: "Saurabh Maurya — Backend Engineer",
    shareDescription: "Distributed systems, platform engineering, and AI.",
    shareImageUrl: "https://res.cloudinary.com/demo/image/upload/share.png",
  };

  const snapshot = snapshotForVariant(state);

  assert.deepEqual(snapshot.meta?.branding, state.variants[0].branding);
});
