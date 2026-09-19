import test from "node:test";
import assert from "node:assert/strict";
import { skillIconUrl, skillInitials } from "../lib/skill-icons.ts";

test("maps known skills to simple-icons slugs", () => {
  assert.equal(skillIconUrl("React"), "https://cdn.simpleicons.org/react");
  assert.equal(skillIconUrl("  postgres "), "https://cdn.simpleicons.org/postgresql");
});

test("does not map AWS, which has no simple-icons slug", () => {
  // Mapping these to `amazonwebservices` produced a permanent 404.
  assert.equal(skillIconUrl("AWS"), null);
  assert.equal(skillIconUrl("Amazon Web Services"), null);
});

test("unknown skills have no icon url", () => {
  assert.equal(skillIconUrl("Beam"), null);
  assert.equal(skillIconUrl(""), null);
});

test("single-word skills keep their leading characters", () => {
  assert.equal(skillInitials("AWS"), "AWS");
  assert.equal(skillInitials("Rust"), "RUS");
  assert.equal(skillInitials("Go"), "GO");
});

test("multi-word skills use one letter per word", () => {
  assert.equal(skillInitials("Amazon Web Services"), "AWS");
  assert.equal(skillInitials("Google Cloud Platform Engine"), "GCP");
});

test("handles blank and padded input", () => {
  assert.equal(skillInitials(""), "");
  assert.equal(skillInitials("   "), "");
  assert.equal(skillInitials("  aws  "), "AWS");
});
