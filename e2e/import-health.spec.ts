import { expect, test } from "@playwright/test";

test("GitHub import turns selected repositories into editable projects", async ({
  page,
}) => {
  await page.route("**/api/github/repositories?username=octocat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        username: "octocat",
        repositories: [
          {
            id: 1,
            name: "demo-repo",
            fullName: "octocat/demo-repo",
            description: "A repository imported into the portfolio.",
            htmlUrl: "https://github.com/octocat/demo-repo",
            homepage: "https://example.com",
            language: "TypeScript",
            topics: ["nextjs", "portfolio"],
            stars: 42,
            forks: 3,
            fork: false,
            archived: false,
            pushedAt: "2026-09-19T00:00:00Z",
          },
        ],
      }),
    });
  });

  await page.goto("/builder?fresh=1");
  await page.getByRole("button", { name: "Import GitHub" }).click();

  const dialog = page.getByRole("dialog", { name: "Import from GitHub" });
  await expect(dialog).toBeVisible();

  await dialog
    .getByLabel("GitHub username or profile URL")
    .fill("octocat");
  await dialog.getByRole("button", { name: "Load repositories" }).click();

  const repository = dialog.locator(".github-repository-row").filter({
    hasText: "demo-repo",
  });
  await expect(repository).toBeVisible();
  await repository.locator('input[type="checkbox"]').check();
  await dialog.getByRole("button", { name: "Import 1 project" }).click();

  await expect(dialog).toBeHidden();

  // getByDisplayValue is a Testing Library API, not a Playwright one, and an
  // input[value=...] selector reads the HTML attribute, which React does not
  // update for controlled inputs. Assert on the workspace the import produced.
  const importedProject = () =>
    page.evaluate(() => {
      const raw = window.localStorage.getItem("folioblocks:workspace");
      if (!raw) return null;
      const projects = JSON.parse(raw)?.data?.projects ?? [];
      const match = projects.find(
        (project: { title?: string }) => project.title === "demo-repo"
      );
      return match ? { title: match.title, githubUrl: match.githubUrl } : null;
    });

  await expect.poll(importedProject).toEqual({
    title: "demo-repo",
    githubUrl: "https://github.com/octocat/demo-repo",
  });

  await page.getByRole("button", { name: "Targeting" }).click();
  await expect(page.getByText("demo-repo", { exact: true })).toBeVisible();
});

test("portfolio health reports actionable issues and navigates to the right editor tab", async ({
  page,
}) => {
  await page.goto("/builder?fresh=1");
  await page.getByRole("button", { name: "Check health" }).click();

  const dialog = page.getByRole("dialog", { name: /things need attention/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Add your name")).toBeVisible();
  await expect(dialog.getByText("No projects are targeted")).toBeVisible();

  const projectIssue = dialog
    .locator(".portfolio-health-item")
    .filter({ hasText: "No projects are targeted" });

  await projectIssue.getByRole("button", { name: "Open Targeting" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Targeting" })).toHaveClass(
    /active/
  );
});
