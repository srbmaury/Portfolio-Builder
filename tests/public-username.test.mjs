import test from "node:test";
import assert from "node:assert/strict";

import { publicUsernameForProfile } from "../lib/portfolio.ts";

test("replaces a demo-generated Alex Morgan username when the real profile name changes", () => {
  assert.equal(
    publicUsernameForProfile(
      "alex-morgan-c0e01d",
      "Saurabh Maurya",
      "c0e01d99-0000-0000-0000-000000000000"
    ),
    "saurabh-maurya-c0e01d"
  );
});

test("preserves a non-demo existing public username", () => {
  assert.equal(
    publicUsernameForProfile(
      "custom-handle-a1b2c3",
      "Saurabh Maurya",
      "c0e01d99-0000-0000-0000-000000000000"
    ),
    "custom-handle-a1b2c3"
  );
});

test("creates a username from the current profile name when none exists", () => {
  assert.equal(
    publicUsernameForProfile(
      null,
      "Saurabh Maurya",
      "c0e01d99-0000-0000-0000-000000000000"
    ),
    "saurabh-maurya-c0e01d"
  );
});

test("replaces a username generated from the current demo persona", () => {
  assert.equal(
    publicUsernameForProfile(
      "maya-chen-c0e01d",
      "Saurabh Maurya",
      "c0e01d99-0000-0000-0000-000000000000"
    ),
    "saurabh-maurya-c0e01d"
  );
});

test("keeps the username of a user actually named after the demo persona", () => {
  // Their own name legitimately produces the demo slug, so it is not a leftover.
  assert.equal(
    publicUsernameForProfile(
      "maya-chen-c0e01d",
      "Maya Chen",
      "c0e01d99-0000-0000-0000-000000000000"
    ),
    "maya-chen-c0e01d"
  );
  assert.equal(
    publicUsernameForProfile(
      "alex-morgan-c0e01d",
      "Alex Morgan",
      "c0e01d99-0000-0000-0000-000000000000"
    ),
    "alex-morgan-c0e01d"
  );
});
