import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8"
);

test("tablet photo heroes keep copy before image like mobile", () => {
  const tabletStart = css.indexOf("@media (max-width: 900px)");
  const tabletEnd = css.indexOf("@media (max-width: 600px)", tabletStart);
  assert.ok(tabletStart >= 0 && tabletEnd > tabletStart);

  const tabletCss = css.slice(tabletStart, tabletEnd);
  assert.match(
    tabletCss,
    /\.hero-photo-frame,[\s\S]*\.hero-portrait \.hero-photo-frame[\s\S]*order:\s*0/
  );
  assert.doesNotMatch(tabletCss, /hero-photo-frame[^}]*order:\s*-1/);
});

test("tablet breakpoint resets desktop-only experience placement without flattening all grids", () => {
  const tabletStart = css.indexOf("@media (max-width: 900px)");
  const tabletEnd = css.indexOf("@media (max-width: 600px)", tabletStart);
  const tabletCss = css.slice(tabletStart, tabletEnd);

  assert.match(tabletCss, /\.experience-v-ledger \.experience-layout-item/);
  assert.match(tabletCss, /grid-column:\s*1\s*!important/);
  assert.match(tabletCss, /\.project-showcase-card[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(
    tabletCss,
    /\.skills-v-logo-grid \.skills-layout-list[\s\S]*repeat\(2,1fr\)/
  );
});
