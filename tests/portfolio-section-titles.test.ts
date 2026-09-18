import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultConfig,
  emptyBuilderState,
  normalizeBuilderState,
  type BuilderState,
} from "../lib/portfolio.ts";

test("fresh workspaces keep editable default section names", () => {
  const titles = emptyBuilderState.variants[0].config.sections.map(
    (section) => section.title
  );
  assert.deepEqual(
    titles,
    defaultConfig.sections.map((section) => section.title)
  );
});

test("normalization restores a default title instead of hiding a heading", () => {
  const state: BuilderState = structuredClone(emptyBuilderState);
  state.variants[0].config.sections[1].title = "";

  const normalized = normalizeBuilderState(state);

  assert.equal(
    normalized.variants[0].config.sections[1].title,
    defaultConfig.sections[1].title
  );
});
