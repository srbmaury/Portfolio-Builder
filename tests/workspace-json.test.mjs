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


test("workspace JSON normalizes unsupported theme and layout values", () => {
  const raw = structuredClone(emptyBuilderState);
  raw.variants[0].config.theme = "not-a-theme";
  raw.variants[0].config.sections[0].variant = "not-a-layout";

  const result = parseWorkspaceJson(JSON.stringify(raw));

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.state.variants[0].config.theme, "ink");
  assert.equal(result.state.variants[0].config.sections[0].variant, "split");
});

test("workspace JSON rejects two portfolios sharing an id", () => {
  const variant = {
    id: "solo",
    name: "Solo",
    config: { theme: "ink", sections: [] },
    content: { experienceIds: [], projectIds: [], skills: [] },
  };

  const result = parseWorkspaceJson(
    JSON.stringify({
      data: { profile: { name: "Ada" } },
      variants: [variant, { ...variant }],
    })
  );

  assert.equal(result.ok, false);
  assert.match(result.error, /share the id "solo"/);
});

test("workspace JSON rejects a portfolio with no usable id", () => {
  for (const broken of [{}, { id: "" }, { id: "   " }, { id: 7 }]) {
    const result = parseWorkspaceJson(
      JSON.stringify({
        data: { profile: { name: "Ada" } },
        variants: [broken],
      })
    );

    assert.equal(result.ok, false, JSON.stringify(broken));
    assert.match(result.error, /non-empty string id/);
  }
});
