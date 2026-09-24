import { expect, test } from "@playwright/test";

test("fresh builder supports keyboard-first editing without inaccessible controls", async ({
  page,
}) => {
  await page.goto("/builder?fresh=1");

  await expect(page.getByRole("link", { name: /devfoliox/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Content" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Targeting" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Design" })).toBeVisible();

  const newPortfolio = page.getByRole("button", { name: "+ New" }).first();
  await newPortfolio.click();

  const dialog = page.getByRole("dialog", { name: "Create portfolio variant" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(":focus")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  const unnamedButtons = await page.locator("button").evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const label =
          button.getAttribute("aria-label") ||
          button.getAttribute("title") ||
          button.textContent ||
          "";
        return !label.trim();
      })
      .map((button) => button.outerHTML)
  );
  expect(unnamedButtons).toEqual([]);

  const missingAltImages = await page.locator("img:not([alt])").count();
  expect(missingAltImages).toBe(0);

  const resizer = page.getByRole("button", {
    name: "Resize editor and preview panels",
  });
  await resizer.focus();
  await page.keyboard.press("ArrowRight");
  await expect(resizer).toBeFocused();
});

test("tablet and mobile preview use real isolated viewport widths", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/builder");

  const previewFrame = page.frameLocator(".preview-device-frame");
  await expect(previewFrame.locator("body")).toBeVisible();

  await page.getByRole("button", { name: "mobile" }).click();
  await expect(page.locator(".preview-window.preview-mobile")).toBeVisible();

  await expect
    .poll(async () => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes("/builder/preview"));
      return frame?.evaluate(() => window.innerWidth);
    })
    .toBe(390);

  await expect
    .poll(async () => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes("/builder/preview"));
      return frame?.evaluate(() =>
        window.matchMedia("(max-width: 760px)").matches
      );
    })
    .toBe(true);

  await page.getByRole("button", { name: "tablet" }).click();
  await expect(page.locator(".preview-window.preview-tablet")).toBeVisible();

  await expect
    .poll(async () => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes("/builder/preview"));
      return frame?.evaluate(() => window.innerWidth);
    })
    .toBe(768);

  await expect
    .poll(async () => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes("/builder/preview"));
      return frame?.evaluate(() =>
        window.matchMedia("(max-width: 760px)").matches
      );
    })
    .toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".builder-shell")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" }).or(
    page.getByRole("button", { name: "Sign in to publish" })
  )).toBeVisible();
});

test("tablet and mobile preserve photo hero hierarchy by layout", async ({ page }) => {
  await page.goto("/builder");

  await expect
    .poll(() =>
      page.evaluate(() => Boolean(window.localStorage.getItem("folioblocks:workspace")))
    )
    .toBe(true);

  // A fresh workspace has no profile content, so every section is filtered out
  // of the preview and there is no hero to measure. Load the demo first.
  await page.getByRole("button", { name: "Load demo" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("folioblocks:workspace");
        if (!raw) return false;
        // Profile content lives on the state, not on the active variant.
        const state = JSON.parse(raw);
        return Boolean(state?.data?.profile?.name);
      })
    )
    .toBe(true);

  async function useHeroLayout(layout: "image-split" | "portrait") {
    // The builder writes its in-memory draft on pagehide, so editing local
    // storage and reloading lets that handler put the old state back. Step off
    // the builder first so nothing overwrites the change.
    await page.goto("/login");
    await page.evaluate((variant) => {
      const key = "folioblocks:workspace";
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error("Builder state was not persisted.");

      const state = JSON.parse(raw);
      const active = state.variants.find(
        (portfolio: { id: string }) => portfolio.id === state.activeVariantId
      );
      const hero = active.config.sections.find(
        (section: { id: string }) => section.id === "hero"
      );
      hero.variant = variant;
      // The column checks below are about the GitHub project layout; set it
      // here rather than depend on whichever layout the demo happens to use.
      const projects = active.config.sections.find(
        (section: { id: string }) => section.id === "projects"
      );
      projects.variant = "github";
      window.localStorage.setItem(key, JSON.stringify(state));
    }, layout);

    await page.goto("/builder");
  }

  async function verticalOrder() {
    const preview = page.frameLocator(".preview-device-frame");
    const copy = preview.locator(".hero-photo-copy");
    const photo = preview.locator(".hero-photo-frame");
    await expect(copy).toBeVisible();
    await expect(photo).toBeVisible();

    const copyBox = await copy.boundingBox();
    const photoBox = await photo.boundingBox();
    expect(copyBox).not.toBeNull();
    expect(photoBox).not.toBeNull();

    return {
      copyY: copyBox!.y,
      photoY: photoBox!.y,
    };
  }

  await useHeroLayout("image-split");
  await page.getByRole("button", { name: "tablet" }).click();
  await expect(page.locator(".preview-window.preview-tablet")).toBeVisible();
  const tabletImageSplit = await verticalOrder();
  expect(tabletImageSplit.copyY).toBeLessThan(tabletImageSplit.photoY);

  await page.getByRole("button", { name: "mobile" }).click();
  await expect(page.locator(".preview-window.preview-mobile")).toBeVisible();
  const mobileImageSplit = await verticalOrder();
  expect(mobileImageSplit.copyY).toBeLessThan(mobileImageSplit.photoY);

  await useHeroLayout("portrait");
  await page.getByRole("button", { name: "tablet" }).click();
  await expect(page.locator(".preview-window.preview-tablet")).toBeVisible();
  const tabletPortrait = await verticalOrder();
  expect(tabletPortrait.photoY).toBeLessThan(tabletPortrait.copyY);

  await page.getByRole("button", { name: "mobile" }).click();
  await expect(page.locator(".preview-window.preview-mobile")).toBeVisible();
  const mobilePortrait = await verticalOrder();
  expect(mobilePortrait.photoY).toBeLessThan(mobilePortrait.copyY);

  const preview = page.frameLocator(".preview-device-frame");

  // The preview frame animates its width, so a measurement taken straight
  // after the click reads the previous device's layout. Wait for the frame's
  // own viewport to reach the expected width before measuring.
  async function usePreviewDevice(device: "tablet" | "mobile", width: number) {
    await page.getByRole("button", { name: device, exact: true }).click();
    await expect(page.locator(`.preview-window.preview-${device}`)).toBeVisible();
    await expect
      .poll(() =>
        preview
          .locator("body")
          .evaluate((element) => element.ownerDocument.documentElement.clientWidth)
      )
      .toBe(width);
  }

  await usePreviewDevice("tablet", 768);
  const tabletExperienceColumns = await preview
    .locator(".experience-v-ledger .experience-layout-item")
    .first()
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(tabletExperienceColumns.trim().split(/\s+/)).toHaveLength(1);

  const tabletProjectColumns = await preview
    .locator(".github-project-grid")
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(tabletProjectColumns.trim().split(/\s+/)).toHaveLength(2);

  await usePreviewDevice("mobile", 390);
  const mobileProjectColumns = await preview
    .locator(".github-project-grid")
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(mobileProjectColumns.trim().split(/\s+/)).toHaveLength(1);
});

test("SEO metadata routes expose crawler guidance", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain("<urlset");
  expect(xml).toContain("/docs");
});


test("section ordering and hero resume modal work from saved builder state", async ({
  page,
}) => {
  await page.goto("/builder?fresh=1");

  await page.getByRole("button", { name: "Design" }).click();
  await expect(page.getByText("Section order", { exact: true })).toBeVisible();

  const rows = page.locator(".section-order-row");
  const firstLabel = (await rows.nth(0).locator("strong").textContent()) || "";
  const secondLabel = (await rows.nth(1).locator("strong").textContent()) || "";

  await rows
    .nth(0)
    .getByRole("button", { name: new RegExp(`Move .+ section down`) })
    .click();

  await expect(rows.nth(0).locator("strong")).toHaveText(secondLabel);
  await expect(rows.nth(1).locator("strong")).toHaveText(firstLabel);

  // The rest of this test reads the rendered preview. A fresh workspace has no
  // profile content, so every section is filtered out and nothing renders;
  // load the demo to give the hero and résumé sections something to show.
  await page.getByRole("button", { name: "Content", exact: true }).click();
  await page.getByRole("button", { name: "Load demo" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("folioblocks:workspace");
        if (!raw) return false;
        return Boolean(JSON.parse(raw)?.data?.profile?.name);
      })
    )
    .toBe(true);

  // Step off the builder so its pagehide draft save cannot overwrite this.
  await page.goto("/login");
  await page.evaluate(() => {
    const key = "folioblocks:workspace";
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error("Builder state was not persisted.");

    const state = JSON.parse(raw);
    const active = state.variants.find(
      (variant: { id: string }) => variant.id === state.activeVariantId
    );

    active.resume = {
      url: "https://res.cloudinary.com/demo/raw/upload/v1/folioblocks/uploads/resume.pdf",
      publicId: "folioblocks/uploads/resume.pdf",
      fileName: "Resume.pdf",
      showInHero: false,
      hideSectionWhenHeroLink: false,
    };

    // The demo ships the résumé section hidden, and this test needs it on to
    // observe it being hidden again by the hero link.
    const resumeSection = active.config.sections.find(
      (section: { id: string }) => section.id === "resume"
    );
    if (resumeSection) resumeSection.visible = true;

    window.localStorage.setItem(key, JSON.stringify(state));
  });

  await page.goto("/builder");

  // The résumé controls only exist once that editor section is expanded.
  await page
    .locator("button.editor-section-toggle")
    .filter({ hasText: "Resume" })
    .first()
    .click();

  const heroToggle = page.getByRole("checkbox", {
    name: /show résumé link in hero/i,
  });
  await expect(heroToggle).toBeEnabled();
  await heroToggle.check();

  // The portfolio renders inside the preview iframe, so these controls are not
  // in the builder's own document.
  const preview = page.frameLocator(".preview-device-frame");
  // The standalone résumé section renders its own "View résumé" button, so
  // match the hero's one specifically.
  const resumeAction = preview.locator("button.hero-resume-link");
  await expect(resumeAction).toBeVisible();
  await expect(preview.locator(".resume-section")).toBeVisible();

  const hideStandalone = page.getByRole("checkbox", {
    name: /hide standalone resume section when hero link is shown/i,
  });
  await expect(hideStandalone).toBeEnabled();
  await hideStandalone.check();

  await expect(resumeAction).toBeVisible();
  await expect(preview.locator(".resume-section")).toHaveCount(0);
  await resumeAction.click();

  const dialog = preview.getByRole("dialog", { name: /resume\.pdf preview/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /open in new tab/i })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
