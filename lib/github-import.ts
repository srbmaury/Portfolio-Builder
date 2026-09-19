import type { Project } from "./portfolio.ts";

export type GitHubRepositorySummary = {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  language: string;
  topics: string[];
  stars: number;
  forks: number;
  fork: boolean;
  archived: boolean;
  pushedAt: string;
};

export function parseGitHubUsername(input: string) {
  const value = input.trim();
  if (!value) return "";

  if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(value)) {
    return value;
  }

  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    if (url.hostname.toLowerCase() !== "github.com") return "";

    const [username] = url.pathname.split("/").filter(Boolean);
    return username &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(username)
      ? username
      : "";
  } catch {
    return "";
  }
}

export function normalizeGitHubRepositoryUrl(value?: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "github.com") return "";
    return `https://github.com${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return "";
  }
}

export function githubRepositoryToProject(
  repository: GitHubRepositorySummary
): Omit<Project, "id"> {
  const stack = Array.from(
    new Set(
      [repository.language, ...repository.topics]
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 8);

  return {
    title: repository.name,
    description: repository.description.trim(),
    stack,
    githubUrl: repository.htmlUrl,
    liveUrl: safeHttpUrl(repository.homepage) || undefined,
  };
}

function safeHttpUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}
