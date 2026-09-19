import { expect, test, type FrameLocator, type Page } from "@playwright/test";

/**
 * Behavioural replacements for the source-text contract tests. These assert
 * what the browser actually computes, so they fail when a rule is present but
 * defeated by the cascade, specificity or a later breakpoint.
 */

const THEMES = [
  "ink", "sand", "moss", "aurora", "cobalt",
  "rose", "mono", "sunset", "ice", "noir",
];

async function openDemoBuilder(page: Page) {
  await page.goto("/builder?demo=1");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("folioblocks:workspace");
        return raw ? Boolean(JSON.parse(raw)?.data?.profile?.name) : false;
      })
    )
    .toBe(true);
  await expect(page.locator("iframe.preview-device-frame")).toBeVisible();
}

/**
 * The builder persists its in-memory draft on pagehide, so patching local
 * storage and reloading lets that handler write the old state back over the
 * patch. Leave the builder first, edit storage while nothing is mounted to
 * overwrite it, then return.
 */
async function patchWorkspace(
  page: Page,
  mutate: (state: Record<string, any>, value: any) => void,
  value: unknown
) {
  await page.goto("/login");
  await page.evaluate(
    ({ body, value }) => {
      const key = "folioblocks:workspace";
      const state = JSON.parse(window.localStorage.getItem(key)!);
      // eslint-disable-next-line no-new-func
      new Function("state", "value", body)(state, value);
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { body: `(${mutate.toString()})(state, value)`, value }
  );
  await page.goto("/builder");
  await expect(page.locator("iframe.preview-device-frame")).toBeVisible();
}

/** Applies a patch to the active variant's config. */
async function patchActiveVariant(page: Page, patch: Record<string, unknown>) {
  await patchWorkspace(
    page,
    (state, value) => {
      const active = state.variants.find(
        (variant: { id: string }) => variant.id === state.activeVariantId
      );
      Object.assign(active.config, value);
    },
    patch
  );
}

async function setSectionVariant(page: Page, sectionId: string, variant: string) {
  await patchWorkspace(
    page,
    (state, value) => {
      const active = state.variants.find(
        (v: { id: string }) => v.id === state.activeVariantId
      );
      const section = active.config.sections.find(
        (s: { id: string }) => s.id === value.sectionId
      );
      if (section) {
        section.variant = value.variant;
        section.visible = true;
      }
    },
    { sectionId, variant }
  );
}

/** Waits for the preview frame to actually reach a device width. */
async function usePreviewDevice(page: Page, device: string, width: number) {
  await page.getByRole("button", { name: device, exact: true }).click();
  await expect
    .poll(
      () =>
        page
          .frameLocator(".preview-device-frame")
          .locator("body")
          .evaluate((el) => el.ownerDocument.documentElement.clientWidth),
      { timeout: 15000 }
    )
    .toBe(width);
}

function columnCount(gridTemplateColumns: string) {
  const value = gridTemplateColumns.trim();
  return value === "none" ? 1 : value.split(/\s+/).length;
}

/** sRGB relative luminance, per WCAG 2.x. */
function luminance([r, g, b]: number[]) {
  const channel = (raw: number) => {
    const v = raw / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: number[], b: number[]) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

test("every theme renders readable muted and accent text", async ({ page }) => {
  await openDemoBuilder(page);
  const preview: FrameLocator = page.frameLocator(".preview-device-frame");

  for (const theme of THEMES) {
    await patchActiveVariant(page, { theme });

    // Resolve the custom properties the way the browser does, by painting them
    // onto a probe element and reading back the computed rgb triples.
    const colors = await preview.locator("main.portfolio").evaluate((main) => {
      const probe = main.ownerDocument.createElement("span");
      probe.style.display = "none";
      main.appendChild(probe);
      const read = (token: string) => {
        probe.style.color = `var(${token})`;
        const value = getComputedStyle(probe).color;
        const parts = value.match(/[\d.]+/g) || [];
        return parts.slice(0, 3).map(Number);
      };
      const out = {
        theme: main.className,
        soft: read("--soft"),
        accent: read("--p-accent"),
        bg: read("--bg"),
        surface: read("--surface"),
      };
      probe.remove();
      return out;
    });

    expect(colors.theme, `theme class for ${theme}`).toContain(`theme-${theme}`);

    for (const fg of ["soft", "accent"] as const) {
      for (const bg of ["bg", "surface"] as const) {
        const ratio = contrast(colors[fg], colors[bg]);
        expect(
          ratio,
          `${theme}: ${fg} on ${bg} was ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});

test("dense layouts collapse to one column at tablet width", async ({ page }) => {
  await openDemoBuilder(page);
  const preview = page.frameLocator(".preview-device-frame");

  const cases: Array<[string, string, string]> = [
    ["about", "split", ".about-v-split .about-layout-grid"],
    ["about", "facts", ".about-v-facts .about-layout-grid"],
    ["about", "compact", ".about-v-compact .about-layout-grid"],
    ["experience", "timeline", ".experience-v-timeline .experience-layout-item"],
    ["experience", "ledger", ".experience-v-ledger .experience-layout-item"],
    ["experience", "spotlight", ".experience-v-spotlight .experience-layout-item"],
    ["experience", "compact", ".experience-v-compact .experience-layout-item"],
    ["experience", "alternating", ".experience-v-alternating .experience-layout-item"],
    ["experience", "resume", ".experience-v-resume .experience-layout-item"],
    ["experience", "steps", ".experience-v-steps .experience-layout-item"],
    ["projects", "showcase", ".project-showcase-card"],
  ];

  for (const [section, variant, selector] of cases) {
    await setSectionVariant(page, section, variant);
    await usePreviewDevice(page, "tablet", 768);
    const columns = await preview
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(columnCount(columns), `${section}/${variant} at 768px -> ${columns}`).toBe(1);
  }
});

test("tablet-friendly grids stay multi-column at tablet and collapse on mobile", async ({
  page,
}) => {
  await openDemoBuilder(page);
  const preview = page.frameLocator(".preview-device-frame");

  await setSectionVariant(page, "projects", "github");
  await usePreviewDevice(page, "tablet", 768);
  const tabletProjects = await preview
    .locator(".github-project-grid")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(columnCount(tabletProjects), `projects at 768px -> ${tabletProjects}`).toBe(2);

  await usePreviewDevice(page, "mobile", 390);
  const mobileProjects = await preview
    .locator(".github-project-grid")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(columnCount(mobileProjects), `projects at 390px -> ${mobileProjects}`).toBe(1);

  await setSectionVariant(page, "skills", "logo-grid");
  await usePreviewDevice(page, "tablet", 768);
  const skills = await preview
    .locator(".skills-v-logo-grid .skills-layout-list")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(columnCount(skills), `skills at 768px -> ${skills}`).toBe(2);
});

test("about facts and minimal contact keep their intended styling", async ({ page }) => {
  await openDemoBuilder(page);
  const preview = page.frameLocator(".preview-device-frame");

  // .about-facts renders for every about variant except stats/facts, which
  // swap in a .stats-grid instead.
  await setSectionVariant(page, "about", "split");
  const fact = await preview
    .locator(".about-facts > div")
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el);
      return { display: cs.display, rowGap: parseFloat(cs.rowGap) || 0 };
    });
  expect(fact.display, "about fact rows are a grid").toBe("grid");
  expect(fact.rowGap, "about fact rows have an explicit gap").toBeGreaterThan(0);

  await setSectionVariant(page, "contact", "minimal");
  const contact = await preview.locator(".contact-v-minimal").evaluate((el) => {
    const probe = el.ownerDocument.createElement("span");
    el.appendChild(probe);
    probe.style.color = "var(--p-accent)";
    const accent = getComputedStyle(probe).color;
    probe.remove();
    const primary = el.querySelector("a");
    const social = el.querySelector(".social-row a");
    return {
      accent,
      primary: primary ? getComputedStyle(primary).color : null,
      social: social ? getComputedStyle(social).color : null,
    };
  });
  // The primary email button must not be recoloured with the accent, while
  // the social row deliberately is.
  expect(contact.primary, "primary contact link is not accent-coloured").not.toBe(contact.accent);
  if (contact.social) {
    expect(contact.social, "social row uses the accent").toBe(contact.accent);
  }
});

test("content tab counts reflect the open portfolio, not the shared pool", async ({
  page,
}) => {
  await openDemoBuilder(page);

  const subtitles = () =>
    page
      .locator("button.editor-section-toggle")
      .evaluateAll((buttons) =>
        buttons
          .map((button) => (button as HTMLElement).innerText.replace(/\s+/g, " "))
          .filter((text) => /roles|projects|skills/.test(text))
      );

  // The shared pool is identical for every variant, so a count of the pool
  // alone made a portfolio that targets nothing look like it contained
  // everything. The counts must describe what this portfolio publishes.
  await expect.poll(subtitles).toEqual([
    expect.stringMatching(/\d+ of \d+ roles in this portfolio/),
    expect.stringMatching(/\d+ of \d+ projects in this portfolio/),
    expect.stringMatching(/\d+ of \d+ skills in this portfolio/),
  ]);

  // Targeting nothing must read as zero rather than as the pool size.
  await patchWorkspace(
    page,
    (state) => {
      const active = state.variants.find(
        (variant: { id: string }) => variant.id === state.activeVariantId
      );
      active.content.experienceIds = [];
      active.content.projectIds = [];
    },
    null
  );

  const cleared = await subtitles();
  expect(cleared[0]).toMatch(/^Experience 0 of [1-9]\d* roles in this portfolio/);
  expect(cleared[1]).toMatch(/^Projects 0 of [1-9]\d* projects in this portfolio/);
});
