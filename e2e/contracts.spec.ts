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

test("password reset is offered and requests a recovery email", async ({ page }) => {
  await page.goto("/login");
  const submit = page.locator("button.auth-submit");
  await expect(submit).toBeEnabled();

  await page.getByRole("button", { name: /forgot your password/i }).click();

  // Reset mode asks for an address only.
  await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(submit).toHaveText(/send reset link/i);

  // Stub Supabase so the deterministic suite never creates accounts or sends
  // real transactional mail; live delivery is covered by the production Gmail pass.
  await page.route("**/auth/v1/recover**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    })
  );

  const recovery = page.waitForRequest(
    (request) =>
      request.url().includes("/auth/v1/recover") && request.method() === "POST"
  );
  await page.locator('input[type="email"]').fill("nobody@example.test");
  await submit.click();
  const request = await recovery;

  // The link must come back through the callback that exchanges the PKCE code.
  expect(decodeURIComponent(request.url())).toContain("/auth/callback?next=/reset-password");

  // The response must not reveal whether the address has an account.
  await expect(page.locator(".auth-message")).toHaveText(/if that address has an account/i);
});

test("auth callback rejects missing and invalid codes on the public host", async ({
  request,
  baseURL,
}) => {
  const expectedHost = new URL(baseURL!).host;

  const missing = await request.get("/auth/callback", { maxRedirects: 0 });
  expect(missing.status()).toBe(307);
  const missingTarget = new URL(missing.headers()["location"]);
  expect(missingTarget.pathname + missingTarget.search).toBe(
    "/login?error=missing_code"
  );
  // Built from the internal bind address this became https://localhost:10000,
  // which is unreachable for anyone following an emailed link.
  expect(missingTarget.host, "redirect stays on the requesting host").toBe(
    expectedHost
  );

  const invalid = await request.get("/auth/callback?code=not-a-real-code", {
    maxRedirects: 0,
  });
  expect(invalid.status()).toBe(307);
  const invalidTarget = new URL(invalid.headers()["location"]);
  expect(invalidTarget.search).toContain("error=expired_link");
  expect(invalidTarget.host).toBe(expectedHost);
});

test("reset password page refuses to submit without a recovery session", async ({
  page,
}) => {
  await page.goto("/reset-password");
  await expect(
    page.getByText(/this reset link is invalid or has expired/i)
  ).toBeVisible();
  // The control stays disabled, so a visitor cannot attempt a password change.
  await expect(page.locator("button.auth-submit")).toBeDisabled();
});

test("asking for a portfolio that does not exist says so", async ({ page }) => {
  await page.goto("/builder?demo=1");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("folioblocks:workspace");
        return raw ? JSON.parse(raw).variants.length : 0;
      })
    )
    .toBeGreaterThan(1);

  // A known-good id opens that portfolio and says nothing.
  const firstId = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem("folioblocks:workspace")!).variants[0].id
  );
  await page.goto(`/builder?portfolio=${firstId}`);
  await expect(page.locator("iframe.preview-device-frame")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(window.localStorage.getItem("folioblocks:workspace")!).activeVariantId
      )
    )
    .toBe(firstId);
  await expect(page.locator(".builder-notice")).toHaveCount(0);

  // An unknown id previously fell back to whichever portfolio was edited
  // last, with nothing shown, which looked like Edit opening the wrong one.
  await page.goto("/builder?portfolio=definitely-not-a-real-variant");
  await expect(page.locator(".builder-notice")).toBeVisible();
  await expect(page.locator(".builder-notice")).toContainText(
    /could not be found/i
  );
});


test("home exposes X card metadata and Ory verification", async ({ page }) => {
  await page.goto("/");

  // Next appends a content hash to metadata image routes
  // (/twitter-image?1de2661a...), so the URL is matched by prefix.
  const imageUrl = (path: string) =>
    new RegExp(
      `^${new URL(path, page.url()).href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\?.*)?$`
    );

  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image"
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    imageUrl("/twitter-image")
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    imageUrl("/opengraph-image")
  );
  await expect(page.locator('meta[name="ory-verify"]')).toHaveAttribute(
    "content",
    "orynth-53d2c4c72e0141eaa85c34a83e54b1c2"
  );
});

test("social card image routes are directly fetchable by crawlers", async ({
  request,
}) => {
  for (const path of ["/twitter-image", "/opengraph-image"]) {
    const response = await request.get(path, {
      headers: { "user-agent": "Twitterbot/1.0" },
    });

    expect(response.ok(), path).toBeTruthy();
    expect(response.headers()["content-type"], path).toContain("image/png");
    expect((await response.body()).byteLength, path).toBeGreaterThan(10_000);
  }
});
