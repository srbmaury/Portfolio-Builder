import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8"
);

test("photo hero variants keep the same hierarchy on tablet and mobile", () => {
  const tabletStart = css.indexOf("@media (max-width: 900px)");
  const tabletEnd = css.indexOf("@media (max-width: 600px)", tabletStart);
  const mobileStart = css.indexOf(
    "/* Harden every public layout for narrow screens and the in-builder mobile preview. */"
  );
  const mobileEnd = css.indexOf("@media (max-width: 1100px)", mobileStart);

  assert.ok(tabletStart >= 0 && tabletEnd > tabletStart);
  assert.ok(mobileStart >= 0 && mobileEnd > mobileStart);

  const tabletCss = css.slice(tabletStart, tabletEnd);
  const mobileCss = css.slice(mobileStart, mobileEnd);

  assert.match(tabletCss, /\.hero-photo-frame\s*\{[\s\S]*?order:\s*0/);
  assert.match(
    tabletCss,
    /\.hero-portrait \.hero-photo-frame\s*\{[\s\S]*?order:\s*-1/
  );
  assert.match(
    mobileCss,
    /\.hero-photo-frame,[\s\S]*?order:\s*0/
  );
  assert.match(
    mobileCss,
    /\.hero-portrait \.hero-photo-frame\s*\{[\s\S]*?order:\s*-1/
  );
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
