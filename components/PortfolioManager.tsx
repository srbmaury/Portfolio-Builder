"use client";

import { errorMessage } from "@/lib/error-message";
import { useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AppNav } from "@/components/AppNav";
import { ShareLinks } from "@/components/ShareLinks";
import { trackProductEvent } from "@/lib/product-analytics";
import { formatPortfolioDate } from "@/lib/date-format";
import {
  deletePortfolio,
  duplicatePortfolio,
  listPortfolios,
  publishPortfolioByKey,
  renamePortfolio,
  unpublishPortfolio,
  type PortfolioSummary,
  restorePublishedSnapshot,
} from "@/lib/supabase/portfolio-store";

type ViewCounts = Record<string, { views: number; uniqueVisitors: number }>;

export function PortfolioManager({
  initialPortfolios,
  viewCounts = null,
  email,
  isAdmin = false,
}: {
  initialPortfolios: PortfolioSummary[];
  viewCounts?: ViewCounts | null;
  email: string | null;
  isAdmin?: boolean;
}) {
  const [portfolios, setPortfolios] = useState(initialPortfolios);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function withUser<T>(
    variantKey: string,
    action: (supabase: SupabaseClient, user: User) => Promise<T>
  ) {
    setBusyKey(variantKey);
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw new Error("Sign in again to manage portfolios.");
      return await action(supabase, data.user);
    } finally {
      setBusyKey(null);
    }
  }

  async function refresh() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return;
    setPortfolios(await listPortfolios(supabase, data.user));
  }

  async function saveRename(item: PortfolioSummary) {
    const name = editingName.trim();
    if (!name || name === item.name) {
      setEditingKey(null);
      return;
    }

    try {
      await withUser(item.variantKey, (supabase, user) =>
        renamePortfolio(supabase, user, item.variantKey, name)
      );
      setPortfolios((current) =>
        current.map((portfolio) =>
          portfolio.variantKey === item.variantKey
            ? { ...portfolio, name }
            : portfolio
        )
      );
      setEditingKey(null);
      setMessage("Portfolio renamed. Its public URL stays the same.");
    } catch (error) {
      setMessage(errorMessage(error, "Rename failed."));
    }
  }

  async function duplicate(item: PortfolioSummary) {
    try {
      const newKey = await withUser(item.variantKey, (supabase, user) =>
        duplicatePortfolio(supabase, user, item.variantKey)
      );
      await refresh();
      setMessage("Draft copy created.");
      if (newKey) {
        trackProductEvent("portfolio_created", newKey);
        window.location.href = `/builder?portfolio=${encodeURIComponent(newKey)}`;
      }
    } catch (error) {
      setMessage(errorMessage(error, "Duplicate failed."));
    }
  }

  async function restorePublished(item: PortfolioSummary) {
    if (
      !window.confirm(
        `Replace your edits to “${item.name}” with the version currently on its public page? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await withUser(item.variantKey, (supabase, user) =>
        restorePublishedSnapshot(supabase, user, item.variantKey)
      );
      const now = new Date().toISOString();
      setPortfolios((current) =>
        current.map((portfolio) =>
          portfolio.variantKey === item.variantKey
            ? { ...portfolio, updatedAt: now, publishedAt: now }
            : portfolio
        )
      );
      setMessage("Restored this portfolio to its published version.");
    } catch (error) {
      setMessage(
        errorMessage(error, "Could not restore the published version.")
      );
    }
  }

  async function refreshPublished(item: PortfolioSummary) {
    try {
      await withUser(item.variantKey, (supabase, user) =>
        publishPortfolioByKey(supabase, user, item.variantKey)
      );
      const publishedAt = new Date().toISOString();
      setPortfolios((current) =>
        current.map((portfolio) =>
          portfolio.variantKey === item.variantKey
            ? { ...portfolio, isPublished: true, publishedAt, updatedAt: publishedAt }
            : portfolio
        )
      );
      setMessage("Public page updated with your latest edits.");
    } catch (error) {
      setMessage(errorMessage(error, "Could not update the public page."));
    }
  }

  async function togglePublish(item: PortfolioSummary) {
    try {
      if (item.isPublished) {
        await withUser(item.variantKey, (supabase, user) =>
          unpublishPortfolio(supabase, user, item.variantKey)
        );
        setPortfolios((current) =>
          current.map((portfolio) =>
            portfolio.variantKey === item.variantKey
              ? { ...portfolio, isPublished: false, publishedAt: null }
              : portfolio
          )
        );
        setMessage("Portfolio unpublished. You can republish it at the same URL.");
      } else {
        const publicPath = await withUser(item.variantKey, (supabase, user) =>
          publishPortfolioByKey(supabase, user, item.variantKey)
        );
        setPortfolios((current) =>
          current.map((portfolio) =>
            portfolio.variantKey === item.variantKey
              ? {
                  ...portfolio,
                  isPublished: true,
                  publishedAt: new Date().toISOString(),
                  publicPath: publicPath || portfolio.publicPath,
                }
              : portfolio
          )
        );
        setMessage("Portfolio published.");
        trackProductEvent("portfolio_published", item.variantKey);
      }
    } catch (error) {
      setMessage(errorMessage(error, "Publish action failed."));
    }
  }

  async function remove(item: PortfolioSummary) {
    if (
      !window.confirm(
        `Delete “${item.name}”? This removes its saved/published data, target-only content, resume, and uploaded assets no longer used by another portfolio. If it is your last portfolio, the shared workspace data is removed too.`
      )
    ) {
      return;
    }

    try {
      const result = await withUser(item.variantKey, (supabase, user) =>
        deletePortfolio(supabase, user, item.variantKey)
      );
      setPortfolios((current) =>
        current.filter((portfolio) => portfolio.variantKey !== item.variantKey)
      );

      if (result?.deletedSharedWorkspace) {
        window.localStorage.removeItem("folioblocks:workspace");
        setMessage("Portfolio and its shared workspace data were deleted.");
      } else {
        setMessage("Portfolio and its unreferenced uploaded assets were deleted.");
      }
    } catch (error) {
      setMessage(errorMessage(error, "Delete failed."));
    }
  }

  async function deleteAccount() {
    const confirmation = window.prompt(
      "This permanently deletes your account, every portfolio, all saved data, and uploaded Cloudinary assets. Type DELETE to continue."
    );

    if (confirmation !== "DELETE") return;

    setAccountBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.functions.invoke("delete-account", {
        body: {},
      });

      if (error) {
        throw new Error(error.message || "Could not delete account.");
      }

      window.localStorage.removeItem("folioblocks:workspace");
      window.localStorage.removeItem("folioblocks:editor-width");

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The auth user is already deleted. Local storage is cleared above.
      }

      window.location.href = "/";
    } catch (error) {
      setMessage(
        errorMessage(error, "Account deletion failed.")
      );
      setAccountBusy(false);
    }
  }

  async function copyLink(item: PortfolioSummary) {
    if (!item.publicPath) return;
    await navigator.clipboard.writeText(`${window.location.origin}/${item.publicPath}`);
    setMessage("Public link copied.");
  }

  return (
    <main className="portfolio-manager-shell">
      <AppNav
        current="portfolios"
        email={email}
        isAdmin={isAdmin}
        actions={
          <a className="primary-button app-nav-action" href="/builder?create=1">
            New portfolio
          </a>
        }
      />

      <section className="portfolio-manager-content">
        <div className="portfolio-manager-heading">
          <h1>Your portfolios</h1>
          <p>Each portfolio has its own link and its own view counts. Republishing keeps the same link.</p>
        </div>

        {message && <p className="portfolio-manager-message">{message}</p>}

        {portfolios.length ? (
          <div className="portfolio-manager-grid">
            {portfolios.map((item) => {
              const isBusy = busyKey === item.variantKey;
              const publicUrl = item.publicPath ? `/${item.publicPath}` : null;
              const counts = viewCounts?.[item.variantKey] ?? { views: 0, uniqueVisitors: 0 };
              // Publishing freezes a snapshot. Later edits to the shared
              // profile or this variant do not reach the public page until it
              // is published again, which is why a live page can show content
              // the builder no longer has.
              // A couple of seconds of slack absorbs clock skew between the
              // browser that published and the database that records saves.
              const publishedIsStale =
                item.isPublished &&
                Boolean(item.publishedAt) &&
                new Date(item.updatedAt).getTime() -
                  new Date(item.publishedAt as string).getTime() >
                  5000;

              return (
                <article className="portfolio-manager-card" key={item.variantKey}>
                  <div className="portfolio-manager-card-head">
                    <div>
                      <span className={item.isPublished ? "portfolio-status published" : "portfolio-status"}>
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                      {editingKey === item.variantKey ? (
                        <div className="portfolio-rename-row">
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") saveRename(item);
                              if (event.key === "Escape") setEditingKey(null);
                            }}
                          />
                          <button onClick={() => saveRename(item)}>Save</button>
                        </div>
                      ) : (
                        <h2>{item.name || "Untitled portfolio"}</h2>
                      )}
                      <p>{item.targetRole || "No target role yet"}</p>
                    </div>
                    <span className="portfolio-theme-label">{item.theme}</span>
                  </div>

                  <div className="portfolio-manager-meta">
                    {publicUrl ? <code>{publicUrl}</code> : <span>Not live yet. Publish to get a link.</span>}
                    {item.publishedAt && (
                      <span>Published {formatPortfolioDate(item.publishedAt)}</span>
                    )}
                    {publishedIsStale && (
                      <span className="portfolio-stale" role="status">
                        Public page shows an older version of this portfolio.
                      </span>
                    )}
                  </div>

                  {item.isPublished && viewCounts ? (
                    <a
                      className="portfolio-manager-views"
                      href={`/analytics?portfolio=${encodeURIComponent(item.variantKey)}&days=30`}
                    >
                      <strong>{counts.views}</strong>
                      <span>
                        {counts.views === 1 ? "view" : "views"} · {counts.uniqueVisitors}{" "}
                        {counts.uniqueVisitors === 1 ? "visitor" : "visitors"} in the last 30 days
                      </span>
                      <em>Analytics →</em>
                    </a>
                  ) : null}

                  <div className="portfolio-manager-actions primary-actions">
                    {publishedIsStale ? (
                      <>
                        <button
                          className="primary-button"
                          disabled={isBusy}
                          onClick={() => refreshPublished(item)}
                        >
                          Update public page
                        </button>
                        <button
                          className="ghost-button"
                          disabled={isBusy}
                          onClick={() => restorePublished(item)}
                        >
                          Restore published version
                        </button>
                      </>
                    ) : null}
                    {!item.isPublished ? (
                      <button className="primary-button" disabled={isBusy} onClick={() => togglePublish(item)}>
                        Publish
                      </button>
                    ) : item.publicPath ? (
                      <button
                        className={publishedIsStale ? "ghost-button" : "primary-button"}
                        onClick={() => copyLink(item)}
                      >
                        Copy link
                      </button>
                    ) : null}
                    {item.isPublished && item.publicPath ? (
                      <a className="ghost-button" href={`/${item.publicPath}`} target="_blank" rel="noreferrer">
                        Open ↗
                      </a>
                    ) : null}
                    <a className="ghost-button" href={`/builder?portfolio=${encodeURIComponent(item.variantKey)}`}>
                      Edit
                    </a>
                    {!item.isPublished || !viewCounts ? (
                      <a
                        className="ghost-button"
                        href={`/analytics?portfolio=${encodeURIComponent(item.variantKey)}&days=30`}
                      >
                        Analytics
                      </a>
                    ) : null}
                  </div>

                  {item.isPublished && item.publicPath ? (
                    <details className="portfolio-share">
                      <summary>Tracked links for LinkedIn, résumé, email…</summary>
                      <ShareLinks path={`/${item.publicPath}`} />
                    </details>
                  ) : null}

                  <div className="portfolio-manager-actions secondary-actions">
                    <button
                      onClick={() => {
                        setEditingKey(item.variantKey);
                        setEditingName(item.name);
                      }}
                    >
                      Rename
                    </button>
                    <button disabled={isBusy} onClick={() => duplicate(item)}>Duplicate</button>
                    {item.isPublished ? (
                      <button disabled={isBusy} onClick={() => togglePublish(item)}>Unpublish</button>
                    ) : null}
                    <button className="danger-link" disabled={isBusy} onClick={() => remove(item)}>Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="portfolio-manager-empty">
            <h2>No saved portfolios yet.</h2>
            <p>Create one from scratch, save it to the cloud, and it will appear here.</p>
            <a className="primary-button" href="/builder?create=1">Create portfolio</a>
          </div>
        )}
      </section>

      <section className="portfolio-manager-danger-zone">
        <div>
          <p className="panel-kicker">Danger zone</p>
          <h2>Delete account</h2>
          <p>
            Permanently removes every portfolio, shared workspace data, published
            pages, uploaded Cloudinary assets, and your sign-in account.
          </p>
        </div>
        <button
          type="button"
          className="danger-button"
          disabled={accountBusy}
          onClick={deleteAccount}
        >
          {accountBusy ? "Deleting account…" : "Delete account"}
        </button>
      </section>
    </main>
  );
}
