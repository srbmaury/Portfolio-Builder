import { NextResponse } from "next/server";
import type { GitHubRepositorySummary } from "@/lib/github-import";

export const runtime = "nodejs";

const USERNAME_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

type GitHubApiRepository = {
  id?: unknown;
  name?: unknown;
  full_name?: unknown;
  description?: unknown;
  html_url?: unknown;
  homepage?: unknown;
  language?: unknown;
  topics?: unknown;
  stargazers_count?: unknown;
  forks_count?: unknown;
  fork?: unknown;
  archived?: unknown;
  disabled?: unknown;
  pushed_at?: unknown;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username")?.trim() || "";

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Enter a valid GitHub username." },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "FolioBlocks",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
      {
        headers,
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (response.status === 404) {
      return NextResponse.json(
        { error: "GitHub user not found." },
        { status: 404 }
      );
    }

    if (response.status === 403 || response.status === 429) {
      return NextResponse.json(
        { error: "GitHub rate limit reached. Try again later." },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not load GitHub repositories." },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error("Unexpected GitHub response.");
    }

    const repositories = payload
      .map(sanitizeRepository)
      .filter(
        (item): item is GitHubRepositorySummary =>
          item !== null && !item.archived
      );

    return NextResponse.json(
      {
        username,
        repositories,
        rateLimitRemaining: numberFromHeader(
          response.headers.get("x-ratelimit-remaining")
        ),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("GitHub repository import failed", error);
    return NextResponse.json(
      { error: "Could not load GitHub repositories." },
      { status: 502 }
    );
  }
}

function sanitizeRepository(
  value: unknown
): GitHubRepositorySummary | null {
  if (!value || typeof value !== "object") return null;
  const repository = value as GitHubApiRepository;

  if (
    typeof repository.id !== "number" ||
    typeof repository.name !== "string" ||
    typeof repository.full_name !== "string" ||
    typeof repository.html_url !== "string"
  ) {
    return null;
  }

  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    description:
      typeof repository.description === "string" ? repository.description : "",
    htmlUrl: repository.html_url,
    homepage: typeof repository.homepage === "string" ? repository.homepage : "",
    language: typeof repository.language === "string" ? repository.language : "",
    topics: Array.isArray(repository.topics)
      ? repository.topics.filter(
          (topic): topic is string => typeof topic === "string"
        )
      : [],
    stars:
      typeof repository.stargazers_count === "number"
        ? repository.stargazers_count
        : 0,
    forks:
      typeof repository.forks_count === "number"
        ? repository.forks_count
        : 0,
    fork: repository.fork === true,
    archived: repository.archived === true || repository.disabled === true,
    pushedAt:
      typeof repository.pushed_at === "string" ? repository.pushed_at : "",
  };
}

function numberFromHeader(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
