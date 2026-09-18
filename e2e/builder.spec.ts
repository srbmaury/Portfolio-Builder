import { expect, test } from "@playwright/test";

test("fresh builder supports keyboard-first editing without inaccessible controls", async ({
  page,
}) => {
  await page.goto("/builder?fresh=1");

  await expect(page.getByRole("link", { name: /folioblocks/i })).toBeVisible();
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

test("reduced-motion preference and responsive preview remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/builder");

  await page.getByRole("button", { name: "mobile" }).click();
  await expect(page.locator(".preview-window.preview-mobile")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".builder-shell")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" }).or(
    page.getByRole("button", { name: "Sign in to publish" })
  )).toBeVisible();
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
    };

    window.localStorage.setItem(key, JSON.stringify(state));
  });

  await page.goto("/builder");
  const heroToggle = page.getByRole("checkbox", {
    name: /show résumé link in hero/i,
  });
  await expect(heroToggle).toBeEnabled();
  await heroToggle.check();

  const preview = page.locator(".preview-window");
  const resumeAction = preview.getByRole("button", { name: "View résumé" });
  await expect(resumeAction).toBeVisible();
  await resumeAction.click();

  const dialog = page.getByRole("dialog", { name: /resume\.pdf preview/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /open in new tab/i })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
