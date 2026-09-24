"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

export type AppNavPage = "builder" | "portfolios" | "analytics" | "admin";

type AppNavProps = {
  current: AppNavPage;
  /** Signed-in user's email, or null when signed out. */
  email: string | null;
  isAdmin?: boolean;
  /** Page-specific actions kept in the bar at every width (e.g. Publish). */
  actions?: ReactNode;
  /** Page-specific items added to the phone sidebar. */
  sidebarExtras?: ReactNode;
  className?: string;
};

export function AppNav({
  current,
  email,
  isAdmin = false,
  actions,
  sidebarExtras,
  className = "",
}: AppNavProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const links: { page: AppNavPage | "docs"; href: string; label: string }[] = [
    { page: "builder", href: "/builder", label: "Builder" },
    ...(email
      ? ([
          { page: "portfolios", href: "/portfolios", label: "Portfolios" },
          { page: "analytics", href: "/analytics", label: "Analytics" },
        ] as const)
      : []),
    ...(email && isAdmin
      ? ([{ page: "admin", href: "/admin/analytics", label: "Admin" }] as const)
      : []),
    { page: "docs", href: "/docs", label: "Docs" },
  ];

  // Sign-in lands on ?signed_in=1. Confirm it briefly, then drop the flag so
  // a refresh or a shared URL does not repeat it.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("signed_in") !== "1") return;
    url.searchParams.delete("signed_in");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    if (!email) return;
    setWelcome(true);
    const timer = window.setTimeout(() => setWelcome(false), 5000);
    return () => window.clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    document.body.classList.add("app-sidebar-open");

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("app-sidebar-open");
      trigger?.focus();
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      // A full navigation drops any in-memory signed-in state, and the login
      // page reads the flag to confirm the sign-out.
      window.location.assign("/login?signed_out=1");
    } catch (error) {
      setSigningOut(false);
      window.alert(
        `Sign out failed: ${error instanceof Error ? error.message : "please try again."}`
      );
    }
  }

  const account = email ? (
    <button
      type="button"
      className="app-nav-signout"
      onClick={signOut}
      disabled={signingOut}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  ) : (
    <a className="app-nav-signin" href="/login">
      Sign in
    </a>
  );

  return (
    <header className={`app-nav ${className}`.trim()}>
      <div className="app-nav-left">
        <button
          ref={triggerRef}
          type="button"
          className="app-nav-menu-button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true" />
        </button>
        <a className="brand" href="/">
          DevFolio<span>X</span>
        </a>
        <nav className="app-nav-links" aria-label="Main">
          {links.map((link) => (
            <a
              key={link.page}
              href={link.href}
              aria-current={link.page === current ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="app-nav-right">
        {actions}
        <div className="app-nav-account">
          {email ? (
            <span className="app-nav-email" title={email}>
              {email}
            </span>
          ) : null}
          {account}
        </div>
      </div>

      {welcome ? (
        <div className="app-toast" role="status">
          <span>
            Signed in as <strong>{email}</strong>
          </span>
          <button type="button" aria-label="Dismiss" onClick={() => setWelcome(false)}>
            ×
          </button>
        </div>
      ) : null}

      {/* Portalled to <body>: the header's backdrop-filter would otherwise
          become the containing block and trap this fixed layer inside it. */}
      {open ? createPortal(
        <div className="app-sidebar-layer">
          <button
            type="button"
            className="app-sidebar-backdrop"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <aside
            id="app-sidebar"
            className="app-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="app-sidebar-head">
              <span className="brand">
                DevFolio<span>X</span>
              </span>
              <button
                ref={closeRef}
                type="button"
                className="app-sidebar-close"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            {email ? (
              <p className="app-sidebar-account">
                Signed in as <strong>{email}</strong>
              </p>
            ) : null}

            <nav className="app-sidebar-links" aria-label="Main">
              {links.map((link) => (
                <a
                  key={link.page}
                  href={link.href}
                  aria-current={link.page === current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {sidebarExtras ? (
              <div className="app-sidebar-extras" onClick={() => setOpen(false)}>
                {sidebarExtras}
              </div>
            ) : null}

            <div className="app-sidebar-foot">{account}</div>
          </aside>
        </div>,
        document.body
      ) : null}
    </header>
  );
}
