"use client";

import { useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
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
} from "@/lib/supabase/portfolio-store";

export function PortfolioManager({
  initialPortfolios,
  isAdmin = false,
}: {
  initialPortfolios: PortfolioSummary[];
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
      setMessage(error instanceof Error ? error.message : "Rename failed.");
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
      setMessage(error instanceof Error ? error.message : "Duplicate failed.");
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
      setMessage(error instanceof Error ? error.message : "Publish action failed.");
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
      setMessage(error instanceof Error ? error.message : "Delete failed.");
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
        error instanceof Error ? error.message : "Account deletion failed."
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
      <header className="portfolio-manager-topbar">
        <a className="brand" href="/">folio<span>blocks</span></a>
        <nav>
          {isAdmin ? (
            <a className="ghost-button" href="/admin/analytics">Admin analytics</a>
          ) : null}
          <a className="ghost-button" href="/analytics">Analytics</a>
          <a className="ghost-button" href="/builder">Back to builder</a>
          <a className="primary-button" href="/builder?create=1">New portfolio</a>
        </nav>
      </header>

      <section className="portfolio-manager-content">
        <div className="portfolio-manager-heading">
          <p className="panel-kicker">Cloud workspace</p>
          <h1>My Portfolios</h1>
          <p>Edit, duplicate, publish, unpublish, open, or delete each saved portfolio without changing its public URL unexpectedly.</p>
        </div>

        {message && <p className="portfolio-manager-message">{message}</p>}

        {portfolios.length ? (
          <div className="portfolio-manager-grid">
            {portfolios.map((item) => {
              const isBusy = busyKey === item.variantKey;
              const publicUrl = item.publicPath ? `/${item.publicPath}` : null;

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
                    {publicUrl ? <code>{publicUrl}</code> : <span>Publish to create a public link.</span>}
                    {item.publishedAt && (
                      <span>Updated {formatPortfolioDate(item.publishedAt)}</span>
                    )}
                  </div>

                  <div className="portfolio-manager-actions primary-actions">
                    <a className="primary-button" href={`/builder?portfolio=${encodeURIComponent(item.variantKey)}`}>
                      Edit
                    </a>
                    {item.isPublished && item.publicPath ? (
                      <a className="ghost-button" href={`/${item.publicPath}`} target="_blank" rel="noreferrer">
                        Open ↗
                      </a>
                    ) : null}
                    <button className="ghost-button" disabled={isBusy} onClick={() => togglePublish(item)}>
                      {item.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    {item.isPublished && item.publicPath ? (
                      <button className="ghost-button" onClick={() => copyLink(item)}>
                        Copy link
                      </button>
                    ) : null}
                    <a
                      className="ghost-button"
                      href={`/analytics?portfolio=${encodeURIComponent(item.variantKey)}&days=30`}
                    >
                      Analytics
                    </a>
                  </div>

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
