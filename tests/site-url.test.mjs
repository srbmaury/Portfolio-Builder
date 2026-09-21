import test from "node:test";
import assert from "node:assert/strict";

import { siteOrigin } from "../lib/site-url.ts";

test("uses the public DevFolioX domain when no site URL is configured", () => {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;

  try {
    assert.equal(siteOrigin(), "https://devfoliox.qd.je");
  } finally {
    if (configuredOrigin === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = configuredOrigin;
    }
  }
});

test("keeps an explicitly configured origin and removes its trailing slash", () => {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com/";

  try {
    assert.equal(siteOrigin(), "https://preview.example.com");
  } finally {
    if (configuredOrigin === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = configuredOrigin;
    }
  }
});
