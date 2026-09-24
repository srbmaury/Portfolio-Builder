import { expect, test } from "@playwright/test";

test("Google sign-in starts OAuth and returns through the app callback", async ({
  page,
}) => {
  await page.goto("/login");

  const google = page.getByRole("button", { name: /continue with google/i });
  await expect(google).toBeVisible();

  await page.route("**/auth/v1/authorize**", (route) => route.abort());

  const authorizeRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname.endsWith("/auth/v1/authorize") &&
      url.searchParams.get("provider") === "google"
    );
  });

  await google.click();
  const request = await authorizeRequest;
  const url = new URL(request.url());

  expect(url.searchParams.get("provider")).toBe("google");
  const callback = new URL(url.searchParams.get("redirect_to") || "", "http://x");
  expect(callback.pathname).toBe("/auth/callback");
  // The builder confirms the sign-in when it sees signed_in=1.
  expect(callback.searchParams.get("next")).toBe("/builder?signed_in=1");
});

test("Google sign-in is available for account creation but not password reset", async ({
  page,
}) => {
  await page.goto("/login");

  const google = page.getByRole("button", { name: /continue with google/i });
  await expect(google).toBeVisible();

  await page.getByRole("button", { name: /need an account/i }).click();
  await expect(google).toBeVisible();

  await page.getByRole("button", { name: /forgot your password/i }).click();
  await expect(google).toHaveCount(0);
});
