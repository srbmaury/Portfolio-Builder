import test from "node:test";
import assert from "node:assert/strict";

import {
  githubRepositoryToProject,
  normalizeGitHubRepositoryUrl,
  parseGitHubUsername,
} from "../lib/github-import.ts";

test("GitHub source parsing accepts usernames and profile/repository URLs", () => {
  assert.equal(parseGitHubUsername("srbmaury"), "srbmaury");
  assert.equal(
    parseGitHubUsername("https://github.com/srbmaury"),
    "srbmaury"
  );
  assert.equal(
    parseGitHubUsername("github.com/srbmaury/Portfolio-Builder"),
    "srbmaury"
  );
  assert.equal(parseGitHubUsername("https://example.com/srbmaury"), "");
});

test("GitHub repository mapping preserves useful portfolio fields", () => {
  const project = githubRepositoryToProject({
    id: 1,
    name: "portfolio-builder",
    fullName: "srbmaury/portfolio-builder",
    description: "Build role-specific portfolios.",
    htmlUrl: "https://github.com/srbmaury/portfolio-builder",
    homepage: "https://example.com",
    language: "TypeScript",
    topics: ["nextjs", "supabase", "TypeScript"],
    stars: 12,
    forks: 2,
    fork: false,
    archived: false,
    pushedAt: "2026-09-19T00:00:00Z",
  });

  assert.equal(project.title, "portfolio-builder");
  assert.equal(project.description, "Build role-specific portfolios.");
  assert.deepEqual(project.stack, ["TypeScript", "nextjs", "supabase"]);
  assert.equal(
    project.githubUrl,
    "https://github.com/srbmaury/portfolio-builder"
  );
  assert.equal(project.liveUrl, "https://example.com/");
});

test("GitHub repository URLs normalize for duplicate detection", () => {
  assert.equal(
    normalizeGitHubRepositoryUrl(
      "https://github.com/SrbMaury/Portfolio-Builder/"
    ),
    "https://github.com/srbmaury/portfolio-builder"
  );
  assert.equal(
    normalizeGitHubRepositoryUrl("https://example.com/repo"),
    ""
  );
});
