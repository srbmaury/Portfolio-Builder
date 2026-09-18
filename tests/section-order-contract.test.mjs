import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const builder = await readFile(
  new URL("../components/PortfolioBuilder.tsx", import.meta.url),
  "utf8"
);
const actions = await readFile(
  new URL("../components/builder/usePortfolioEditorActions.ts", import.meta.url),
  "utf8"
);

test("design tab exposes a dedicated section-order control", () => {
  assert.match(builder, /Section order/);
  assert.match(builder, /section-order-list/);
  assert.match(builder, /section-order-row/);
  assert.match(actions, /function moveSection/);
  assert.match(builder, /Move .* section up/);
  assert.match(builder, /Move .* section down/);
});
