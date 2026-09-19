"use client";

import { useEffect, useMemo, useState } from "react";
import { useDialogFocusTrap } from "@/lib/accessibility";
import {
  normalizeGitHubRepositoryUrl,
  parseGitHubUsername,
  type GitHubRepositorySummary,
} from "@/lib/github-import";

type GitHubResponse = {
  username?: string;
  repositories?: GitHubRepositorySummary[];
  error?: string;
};

export function GitHubImportDialog({
  initialUsername,
  existingGitHubUrls,
  onClose,
  onImport,
}: {
  initialUsername: string;
  existingGitHubUrls: string[];
  onClose: () => void;
  onImport: (repositories: GitHubRepositorySummary[]) => void;
}) {
  const [source, setSource] = useState(initialUsername);
  const [repositories, setRepositories] = useState<GitHubRepositorySummary[]>([]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [search, setSearch] = useState("");
  const [includeForks, setIncludeForks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(onClose);

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => document.body.classList.remove("dialog-open");
  }, []);

  const imported = useMemo(
    () =>
      new Set(
        existingGitHubUrls
          .map(normalizeGitHubRepositoryUrl)
          .filter(Boolean)
      ),
    [existingGitHubUrls]
  );

  const visibleRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return repositories.filter((repository) => {
      if (!includeForks && repository.fork) return false;
      if (!query) return true;

      return [
        repository.name,
        repository.description,
        repository.language,
        ...repository.topics,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [includeForks, repositories, search]);

  async function loadRepositories(event: React.FormEvent) {
    event.preventDefault();
    const username = parseGitHubUsername(source);

    if (!username) {
      setError("Enter a GitHub username or profile URL.");
      return;
    }

    setLoading(true);
    setError("");
    setSelected(new Set());

    try {
      const response = await fetch(
        `/api/github/repositories?username=${encodeURIComponent(username)}`
      );
      const payload = (await response.json()) as GitHubResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Could not load repositories.");
      }

      setSource(payload.username || username);
      setRepositories(payload.repositories || []);
    } catch (loadError) {
      setRepositories([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load repositories."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleRepository(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedRepositories = repositories.filter((repository) =>
    selected.has(repository.id)
  );

  return (
    <div
      className="create-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="create-dialog github-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="github-import-title"
      >
        <div className="create-dialog-head">
          <div>
            <p className="panel-kicker">Project import</p>
            <h2 id="github-import-title">Import from GitHub</h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="create-dialog-body github-import-body">
          <form className="github-import-search" onSubmit={loadRepositories}>
            <label>
              <span>GitHub username or profile URL</span>
              <div>
                <input
                  autoFocus
                  value={source}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setError("");
                  }}
                  placeholder="octocat or https://github.com/octocat"
                />
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Load repositories"}
                </button>
              </div>
            </label>
          </form>

          {error ? <p className="dialog-error">{error}</p> : null}

          {repositories.length ? (
            <>
              <div className="github-import-controls">
                <label className="github-import-filter">
                  <span className="sr-only">Filter repositories</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filter repositories"
                  />
                </label>
                <label className="github-import-checkbox">
                  <input
                    type="checkbox"
                    checked={includeForks}
                    onChange={(event) => setIncludeForks(event.target.checked)}
                  />
                  Include forks
                </label>
              </div>

              <div className="github-repository-list" aria-live="polite">
                {visibleRepositories.map((repository) => {
                  const normalized = normalizeGitHubRepositoryUrl(
                    repository.htmlUrl
                  );
                  const alreadyImported = imported.has(normalized);

                  return (
                    <label
                      className={
                        alreadyImported
                          ? "github-repository-row imported"
                          : "github-repository-row"
                      }
                      key={repository.id}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(repository.id)}
                        disabled={alreadyImported}
                        onChange={() => toggleRepository(repository.id)}
                      />
                      <span className="github-repository-copy">
                        <span className="github-repository-title">
                          <strong>{repository.name}</strong>
                          {repository.fork ? <small>fork</small> : null}
                          {alreadyImported ? <small>already imported</small> : null}
                        </span>
                        <span>
                          {repository.description ||
                            "No repository description yet."}
                        </span>
                        <small>
                          {[
                            repository.language,
                            repository.stars
                              ? `★ ${repository.stars}`
                              : "",
                            repository.topics.slice(0, 3).join(" · "),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          ) : !loading && !error ? (
            <p className="editor-empty-note">
              Load a public GitHub profile, then choose the repositories you
              want to turn into portfolio projects.
            </p>
          ) : null}
        </div>

        <div className="create-dialog-actions github-import-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={selectedRepositories.length === 0}
            onClick={() => onImport(selectedRepositories)}
          >
            Import {selectedRepositories.length || ""} project
            {selectedRepositories.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
