import { expect, test, type Page } from "@playwright/test";

/**
 * Behavioural replacements for the remaining source-text contract tests.
 * Each asserts observable behaviour: rendered output, focus, or an actual HTTP
 * response, rather than the presence of a string in a source file.
 */

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

test("docs page documents the current feature set and is reachable from home", async ({
  page,
}) => {
  await page.goto("/");
  const docsLink = page.getByRole("link", { name: /docs/i }).first();
  await expect(docsLink).toBeVisible();
  await docsLink.click();
  await expect(page).toHaveURL(/\/docs$/);

  const body = page.locator("body");
  for (const topic of [
    /resume import/i,
    /JSON editor/i,
    /custom sections/i,
    /first-party analytics/i,
    /account deletion/i,
  ]) {
    await expect(body).toContainText(topic);
  }
});

test("reordering a section changes the rendered preview order", async ({ page }) => {
  await openDemoBuilder(page);
  await page.getByRole("button", { name: "Design", exact: true }).click();

  const rows = page.locator(".section-order-row");
  await expect(rows.first()).toBeVisible();

  const readPreviewOrder = () =>
    page
      .frameLocator(".preview-device-frame")
      .locator("body")
      .evaluate((el) =>
        [...el.querySelectorAll(".p-section")].map((s) =>
          (s.className.match(/(hero|about|experience|projects|skills|resume|contact)/) || [])[0]
        )
      );

  const before = await readPreviewOrder();
  expect(before.length).toBeGreaterThan(1);

  await rows
    .first()
    .getByRole("button", { name: /Move .+ section down/ })
    .click();

  // The rendered portfolio, not just the editor list, must reflect the move.
  await expect.poll(readPreviewOrder).not.toEqual(before);
  const after = await readPreviewOrder();
  expect(after[0]).toBe(before[1]);
  expect(after[1]).toBe(before[0]);
});

test("rendered portfolio exposes a working skip link", async ({ page }) => {
  await openDemoBuilder(page);
  const preview = page.frameLocator(".preview-device-frame");

  const skip = preview.locator("a.skip-link");
  await expect(skip).toHaveAttribute("href", "#portfolio-main");
  await expect(preview.locator("#portfolio-main")).toHaveCount(1);

  // It must be reachable by keyboard, not merely present in the DOM.
  const focused = await preview.locator("body").evaluate((el) => {
    const link = el.querySelector<HTMLAnchorElement>("a.skip-link");
    link?.focus();
    return el.ownerDocument.activeElement?.className ?? "";
  });
  expect(focused).toContain("skip-link");
});

test("analytics endpoint rejects malformed, oversized and unknown events", async ({
  request,
}) => {
  const bad = await request.post("/api/analytics/events", {
    data: { nonsense: true },
  });
  expect(bad.status(), "garbage payload").toBe(400);

  const oversized = await request.post("/api/analytics/events", {
    headers: { "Content-Type": "application/json" },
    data: "x".repeat(4096),
  });
  expect([400, 413], "oversized payload").toContain(oversized.status());

  const badType = await request.post("/api/analytics/events", {
    data: { portfolioId: "00000000-0000-0000-0000-000000000000", eventType: "not_a_real_event" },
  });
  expect(badType.status(), "unknown event type").toBe(400);
});

test("creator product analytics endpoint requires authentication", async ({ request }) => {
  const res = await request.post("/api/product-analytics/events", {
    data: { eventType: "builder_opened", variantKey: null },
  });
  expect(res.status(), "anonymous caller").toBe(401);

  const badEvent = await request.post("/api/product-analytics/events", {
    data: { eventType: "definitely_not_tracked" },
  });
  // Rejected on validation or auth, but never accepted.
  expect([400, 401]).toContain(badEvent.status());
});

test("unknown portfolios 404 and published routes stay crawlable", async ({ request }) => {
  expect((await request.get("/nobody/nothing")).status()).toBe(404);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toMatch(/Sitemap:/);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");
});
