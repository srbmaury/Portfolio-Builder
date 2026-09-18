import test from "node:test";
import assert from "node:assert/strict";

import { emptyBuilderState } from "../lib/portfolio.ts";
import {
  formatWorkspaceJson,
  parseWorkspaceJson,
} from "../lib/workspace-json.ts";

test("workspace JSON rejects malformed JSON without producing state", () => {
  const result = parseWorkspaceJson("{ nope");

  assert.equal(result.ok, false);
  assert.match(result.error, /valid JSON/i);
});

test("workspace JSON rejects structurally invalid workspace objects", () => {
  const result = parseWorkspaceJson(JSON.stringify({ hello: "world" }));

  assert.equal(result.ok, false);
  assert.match(result.error, /workspace/i);
});

test("workspace JSON normalizes valid builder state", () => {
  const raw = structuredClone(emptyBuilderState);
  raw.data.profile.name = "Saurabh Maurya";
  delete raw.variants[0].branding;

  const result = parseWorkspaceJson(JSON.stringify(raw));

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.state.data.profile.name, "Saurabh Maurya");
  assert.deepEqual(result.state.variants[0].branding, {
    faviconUrl: "",
    shareTitle: "",
    shareDescription: "",
    shareImageUrl: "",
  });
});

test("workspace JSON formatter returns stable two-space JSON", () => {
  const result = formatWorkspaceJson('{"b":2,"a":1}');

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.text, '{\n  "b": 2,\n  "a": 1\n}');
});
