import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const builderPreview = await readFile(
  new URL("../components/builder/BuilderPreview.tsx", import.meta.url),
  "utf8"
);
const previewPage = await readFile(
  new URL("../components/builder/BuilderPreviewPage.tsx", import.meta.url),
  "utf8"
).catch(() => "");
const stylesheet = new URL("../app/globals.css", import.meta.url);
const cssEntry = await readFile(stylesheet, "utf8");
const imports = [...cssEntry.matchAll(/@import "([^"]+)";/g)];
const css = (
  await Promise.all(imports.map(([, path]) => readFile(new URL(path, stylesheet), "utf8")))
).join("\n");

test("builder preview uses an isolated iframe viewport", () => {
  assert.match(builderPreview, /<iframe/);
  assert.match(builderPreview, /src="\/builder\/preview"/);
  assert.match(builderPreview, /folioblocks:preview/);
  assert.match(previewPage, /window\.addEventListener\("message"/);
  assert.match(previewPage, /PortfolioRenderer/);
  assert.match(previewPage, /event\.origin !== window\.location\.origin/);
});

test("tablet and mobile previews use real device widths instead of desktop crop overrides", () => {
  assert.match(css, /\.preview-window\.preview-tablet[\s\S]*width:\s*768px/);
  assert.match(css, /\.preview-window\.preview-mobile[\s\S]*width:\s*390px/);
  assert.match(css, /\.preview-device-frame/);
  assert.doesNotMatch(
    css,
    /\.preview-window\.preview-mobile \.hero-split/
  );
  assert.doesNotMatch(
    css,
    /\.preview-window\.preview-mobile \.project-grid/
  );
});
