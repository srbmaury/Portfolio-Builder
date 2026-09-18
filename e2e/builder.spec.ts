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
