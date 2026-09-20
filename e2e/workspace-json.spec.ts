import { expect, test } from "@playwright/test";

const SAMPLE = {
  activeVariantId: "solo",
  data: {
    profile: {
      name: "Ada Lovelace",
      role: "Analytical Engine Programmer",
      tagline: "First programmer",
      about: "Wrote the first algorithm intended for a machine.",
      email: "ada@example.com",
      location: "London",
      availability: "Open to work",
      heroImageUrl: "",
      socials: [{ label: "GitHub", url: "https://github.com/ada" }],
    },
    experience: [
      { id: "exp-1", company: "Analytical Engine", role: "Programmer", period: "1842 - 1843", summary: "Notes on the Engine." },
    ],
    projects: [
      { id: "proj-note-g", title: "Note G", description: "Bernoulli number algorithm.", stack: ["Mathematics"], githubUrl: "", liveUrl: "", imageUrl: "" },
    ],
    skills: ["Mathematics", "Algorithms"],
    customSections: [],
  },
  variants: [
    {
      id: "solo",
      name: "Solo Portfolio",
      targetRole: "Programmer",
      config: { theme: "ink", sections: [] },
      content: { experienceIds: ["exp-1"], projectIds: ["proj-note-g"], skills: ["Mathematics"] },
      branding: {},
      resume: {},
    },
  ],
};

async function openJsonEditor(page: import("@playwright/test").Page) {
  await page.goto("/builder");
  await page.getByRole("button", { name: "Edit as JSON" }).click();
  await expect(page.getByRole("dialog", { name: /Edit workspace as JSON/i })).toBeVisible();
  return page.getByLabel("Workspace JSON");
}

test("JSON editor opens pre-filled with the current workspace", async ({ page }) => {
  const textarea = await openJsonEditor(page);
  const value = await textarea.inputValue();
  const parsed = JSON.parse(value);
  expect(parsed).toHaveProperty("variants");
  expect(parsed).toHaveProperty("data.profile");
});

test("applying sample JSON rewrites the workspace", async ({ page }) => {
  const textarea = await openJsonEditor(page);
  await textarea.fill(JSON.stringify(SAMPLE, null, 2));
  await page.getByRole("button", { name: "Apply changes" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('input[value="Ada Lovelace"]').first()).toBeVisible({ timeout: 10_000 });
});

test("invalid JSON is reported and never applied", async ({ page }) => {
  const textarea = await openJsonEditor(page);
  await textarea.fill("{ not json");
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.locator(".create-dialog-error")).toContainText(/valid JSON/i);
  await expect(page.getByRole("dialog", { name: /Edit workspace as JSON/i })).toBeVisible();
});

test("JSON missing required shape is rejected", async ({ page }) => {
  const textarea = await openJsonEditor(page);
  await textarea.fill(JSON.stringify({ data: { profile: {} } }));
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.locator(".create-dialog-error")).toContainText(/variants array/i);
});

test("Format JSON tidies valid input", async ({ page }) => {
  const textarea = await openJsonEditor(page);
  await textarea.fill('{"data":{"profile":{"name":"X"}},"variants":[]}');
  await page.getByRole("button", { name: "Format JSON" }).click();
  expect(await textarea.inputValue()).toContain('\n  "data"');
});

test("a portfolio id that points nowhere is repaired rather than rejected", async ({ page }) => {
  const textarea = await openJsonEditor(page);
  await textarea.fill(
    JSON.stringify({ ...SAMPLE, activeVariantId: "does-not-exist" }, null, 2)
  );
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Edit as JSON" }).click();
  const after = JSON.parse(await page.getByLabel("Workspace JSON").inputValue());
  expect(after.activeVariantId).toBe("solo");
});

test("a variant saved before per-portfolio content still loads", async ({ page }) => {
  const legacy = JSON.parse(JSON.stringify(SAMPLE));
  delete legacy.variants[0].data;

  const textarea = await openJsonEditor(page);
  await textarea.fill(JSON.stringify(legacy, null, 2));
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Edit as JSON" }).click();
  const after = JSON.parse(await page.getByLabel("Workspace JSON").inputValue());
  expect(after.variants[0].data.profile.name).toBe("Ada Lovelace");
  expect(after.variants[0].data.projects.map((p: { id: string }) => p.id)).toEqual([
    "proj-note-g",
  ]);
});

test("two portfolios sharing an id are refused before one can overwrite the other", async ({
  page,
}) => {
  const dupe = JSON.parse(JSON.stringify(SAMPLE));
  dupe.variants.push(JSON.parse(JSON.stringify(dupe.variants[0])));

  const textarea = await openJsonEditor(page);
  await textarea.fill(JSON.stringify(dupe, null, 2));
  await page.getByRole("button", { name: "Apply changes" }).click();

  await expect(page.locator(".create-dialog-error")).toContainText(
    /share the id "solo"/
  );
  await expect(
    page.getByRole("dialog", { name: /Edit workspace as JSON/i })
  ).toBeVisible();
});
