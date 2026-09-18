import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

function parseHex(value) {
  const hex = value.replace("#", "").trim();
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const channels = parseHex(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  const light = Math.max(first, second);
  const dark = Math.min(first, second);
  return (light + 0.05) / (dark + 0.05);
}

function variablesFor(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `Missing theme selector ${selector}`);

  const end = css.indexOf("}", start);
  assert.ok(end > start, `Missing closing brace for ${selector}`);

  const block = css.slice(start, end);
  const vars = {};
  for (const [, key, value] of block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[key] = value;
  }
  return vars;
}

const themes = [
  ".portfolio",
  ".portfolio.theme-sand",
  ".portfolio.theme-moss",
  ".portfolio.theme-aurora",
  ".portfolio.theme-cobalt",
  ".portfolio.theme-rose",
  ".portfolio.theme-mono",
  ".portfolio.theme-sunset",
  ".portfolio.theme-ice",
  ".portfolio.theme-noir",
];

test("muted and accent text maintain readable contrast in every theme", () => {
  for (const selector of themes) {
    const vars = variablesFor(selector);

    for (const foreground of ["soft", "p-accent"]) {
      for (const background of ["bg", "surface"]) {
        const ratio = contrast(vars[foreground], vars[background]);
        assert.ok(
          ratio >= 4.5,
          `${selector} ${foreground}/${background} contrast was ${ratio.toFixed(2)}`
        );
      }
    }
  }
});

test("about fact labels and values have an explicit layout gap", () => {
  assert.match(css, /\.about-facts\s*>?\s*div[^{]*\{[^}]*display:\s*grid;[^}]*gap:/s);
});
