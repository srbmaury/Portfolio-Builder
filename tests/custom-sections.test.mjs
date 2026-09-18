import test from "node:test";
import assert from "node:assert/strict";

import {
  emptyBuilderState,
  normalizeBuilderState,
  sectionHasContent,
  sectionType,
  snapshotForVariant,
} from "../lib/portfolio.ts";
import {
  addCustomSection,
  removeCustomSection,
} from "../lib/custom-sections.ts";

test("empty workspaces include an empty shared custom-section collection", () => {
  assert.deepEqual(emptyBuilderState.data.customSections, []);
});

test("adding a custom section shares content and creates per-variant presentation configs", () => {
  const state = structuredClone(emptyBuilderState);
  state.variants.push({
    ...structuredClone(state.variants[0]),
    id: "second",
    name: "Second",
  });

  const next = addCustomSection(state, "Education");
  const section = next.data.customSections[0];

  assert.ok(section);
  assert.equal(section.title, "Education");

  const activeConfig = next.variants[0].config.sections.find(
    (item) => item.customSectionId === section.id
  );
  const secondConfig = next.variants[1].config.sections.find(
    (item) => item.customSectionId === section.id
  );

  assert.equal(sectionType(activeConfig), "custom");
  assert.equal(activeConfig?.variant, "list");
  assert.equal(activeConfig?.visible, true);
  assert.equal(secondConfig?.visible, false);
});

test("custom section normalization preserves saved ordering and custom config", () => {
  let state = addCustomSection(structuredClone(emptyBuilderState), "Education");
  const custom = state.data.customSections[0];
  state.variants[0].config.sections = [
    state.variants[0].config.sections.find(
      (section) => section.customSectionId === custom.id
    ),
    ...state.variants[0].config.sections.filter(
      (section) => section.customSectionId !== custom.id
    ),
  ].filter(Boolean);

  const normalized = normalizeBuilderState(state);

  assert.equal(normalized.variants[0].config.sections[0].customSectionId, custom.id);
  assert.equal(sectionType(normalized.variants[0].config.sections[0]), "custom");
});

test("custom sections render only when an item has meaningful content", () => {
  let state = addCustomSection(structuredClone(emptyBuilderState), "Education");
  const custom = state.data.customSections[0];
  const config = state.variants[0].config.sections.find(
    (section) => section.customSectionId === custom.id
  );

  assert.equal(sectionHasContent(config, state.data), false);

  custom.items.push({
    id: "custom-item-degree",
    heading: "B.Tech",
    subheading: "University",
    meta: "2020 — 2024",
    description: "Computer Science",
    linkLabel: "",
    linkUrl: "",
  });

  assert.equal(sectionHasContent(config, state.data), true);

  const snapshot = snapshotForVariant(state);
  assert.equal(snapshot.data.customSections.length, 1);
  assert.equal(snapshot.data.customSections[0].items[0].heading, "B.Tech");
});

test("removing a custom section removes its shared content and every variant config", () => {
  let state = addCustomSection(structuredClone(emptyBuilderState), "Education");
  const id = state.data.customSections[0].id;

  state = removeCustomSection(state, id);

  assert.equal(state.data.customSections.length, 0);
  for (const variant of state.variants) {
    assert.equal(
      variant.config.sections.some((section) => section.customSectionId === id),
      false
    );
  }
});
