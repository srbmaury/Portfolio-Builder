import test from "node:test";
import assert from "node:assert/strict";
import { isAdminEmail } from "../lib/admin.ts";

function withAdminEmail(value, run) {
  const previous = process.env.ADMIN_EMAIL;

  if (value === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = value;

  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previous;
  }
}

test("matches the configured admin address", () => {
  withAdminEmail("owner@example.com", () => {
    assert.equal(isAdminEmail("owner@example.com"), true);
  });
});

test("ignores casing and surrounding whitespace on both sides", () => {
  withAdminEmail("  Owner@Example.COM ", () => {
    assert.equal(isAdminEmail("owner@example.com"), true);
    assert.equal(isAdminEmail("OWNER@EXAMPLE.COM"), true);
    assert.equal(isAdminEmail(" owner@example.com  "), true);
  });
});

test("rejects every other address", () => {
  withAdminEmail("owner@example.com", () => {
    assert.equal(isAdminEmail("someone@example.com"), false);
    assert.equal(isAdminEmail("owner@example.com.attacker.test"), false);
    assert.equal(isAdminEmail("owner@example"), false);
  });
});

test("fails closed when ADMIN_EMAIL is unset or blank", () => {
  withAdminEmail(undefined, () => {
    assert.equal(isAdminEmail("owner@example.com"), false);
  });
  withAdminEmail("", () => {
    assert.equal(isAdminEmail("owner@example.com"), false);
  });
  withAdminEmail("   ", () => {
    assert.equal(isAdminEmail("owner@example.com"), false);
    // A blank config must not match a blank user email either.
    assert.equal(isAdminEmail(""), false);
  });
});

test("rejects missing or empty caller emails", () => {
  withAdminEmail("owner@example.com", () => {
    assert.equal(isAdminEmail(undefined), false);
    assert.equal(isAdminEmail(null), false);
    assert.equal(isAdminEmail(""), false);
  });
});
