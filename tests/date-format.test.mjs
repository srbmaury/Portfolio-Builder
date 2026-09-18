import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { formatPortfolioDate } from "../lib/date-format.ts";

const formatter = await readFile(
  new URL("../lib/date-format.ts", import.meta.url),
  "utf8"
).catch(() => "");
const manager = await readFile(
  new URL("../components/PortfolioManager.tsx", import.meta.url),
  "utf8"
);

test("portfolio dates use one deterministic UTC formatter during SSR and hydration", () => {
  assert.equal(
    formatPortfolioDate("2026-09-18T00:00:00Z"),
    "18 Sept 2026"
  );
  assert.equal(formatPortfolioDate("not-a-date"), "");
  assert.match(formatter, /Intl\.DateTimeFormat\("en-GB"/);
  assert.match(formatter, /timeZone:\s*"UTC"/);
  assert.match(formatter, /day:\s*"2-digit"/);
  assert.match(formatter, /month:\s*"short"/);
  assert.match(formatter, /year:\s*"numeric"/);
  assert.match(manager, /formatPortfolioDate\(item\.publishedAt\)/);
  assert.doesNotMatch(manager, /toLocaleDateString\(\)/);
});
