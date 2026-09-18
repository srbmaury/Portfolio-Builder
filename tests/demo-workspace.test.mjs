import test from "node:test";
import assert from "node:assert/strict";

import {
  sampleBuilderState,
  sampleData,
  sampleSnapshot,
  sectionType,
} from "../lib/portfolio.ts";

test("demo workspace showcases role-specific portfolio variants", () => {
  assert.equal(sampleBuilderState.variants.length, 2);
  assert.deepEqual(
    sampleBuilderState.variants.map((variant) => variant.id),
    ["backend-platform", "product-engineer"]
  );
  assert.equal(sampleBuilderState.activeVariantId, "backend-platform");

  const [backend, product] = sampleBuilderState.variants;
  assert.notEqual(backend.config.theme, product.config.theme);
  assert.notDeepEqual(
    backend.content.projectIds,
    product.content.projectIds
  );
  assert.notDeepEqual(
    backend.config.sections.map((section) => section.variant),
    product.config.sections.map((section) => section.variant)
  );
});

test("demo content is rich enough to showcase FolioBlocks", () => {
  assert.ok(sampleData.experience.length >= 3);
  assert.ok(sampleData.projects.length >= 4);
  assert.ok(sampleData.skills.length >= 10);
  assert.ok(sampleData.customSections.length >= 1);
  assert.ok(sampleData.customSections[0].items.length >= 3);

  const customSections = sampleBuilderState.variants[0].config.sections.filter(
    (section) => sectionType(section) === "custom"
  );
  assert.equal(customSections.length, 1);
  assert.equal(customSections[0].visible, true);
});

test("landing sample snapshot matches the primary demo portfolio", () => {
  assert.equal(sampleSnapshot.meta?.name, "Backend & Platform");
  assert.equal(sampleSnapshot.meta?.targetRole, "Backend & Platform Engineer");
  assert.equal(sampleSnapshot.config.theme, "cobalt");
  assert.equal(sampleSnapshot.data.projects.length, 3);
  assert.ok(
    sampleSnapshot.data.customSections.some((section) => section.id === "impact")
  );
});
