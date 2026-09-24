"use client";

import { useEffect, useState } from "react";
import { useDialogFocusTrap } from "@/lib/accessibility";
import { ShareLinks } from "@/components/ShareLinks";

/** Shown right after a successful publish: the moment the link goes live. */
export function PublishedDialog({
  url,
  portfolioName,
  variantKey,
  onClose,
}: {
  url: string;
  portfolioName: string;
  variantKey: string;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(onClose);
  // publish() already tried the clipboard; this only reflects later copies.
  const [copied, setCopied] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const path = new URL(url).pathname;

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => document.body.classList.remove("dialog-open");
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

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
        className="create-dialog published-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="published-dialog-title"
      >
        <div className="create-dialog-head">
          <div>
            <p className="published-dialog-live">
              <i aria-hidden="true" /> Live
            </p>
            <h2 id="published-dialog-title">{portfolioName} is published</h2>
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

        <div className="published-dialog-url">
          <input value={url} readOnly aria-label="Public link" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className="primary-button" onClick={copy}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <a className="ghost-button" href={url} target="_blank" rel="noreferrer">
            Open ↗
          </a>
        </div>

        <div className="published-tracking">
          <button
            type="button"
            className="published-tracking-toggle"
            onClick={() => setTrackingOpen((current) => !current)}
            aria-expanded={trackingOpen}
          >
            <span>
              <strong>Track where you share it</strong>
              <small>Create source-tagged links for LinkedIn, your résumé, or an application.</small>
            </span>
            <b aria-hidden="true">{trackingOpen ? "−" : "+"}</b>
          </button>
          {trackingOpen ? <ShareLinks path={path} /> : null}
        </div>

        <p className="published-dialog-foot">
          Every visit is counted.{" "}
          <a href={`/analytics?portfolio=${encodeURIComponent(variantKey)}&days=30`}>
            See how many people open it →
          </a>
        </p>
      </div>
    </div>
  );
}
