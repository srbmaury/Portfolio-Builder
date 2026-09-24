"use client";

import { useState } from "react";
import {
  SHARE_SOURCES,
  normalizeShareTag,
  taggedShareUrl,
} from "@/lib/share-links";

/**
 * One link per place you post it. Each copy carries ?via=<tag>, so analytics
 * can name the source even when the browser sends no referrer (email apps,
 * PDFs, chat apps).
 */
export function ShareLinks({ path }: { path: string }) {
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState("");

  async function copy(tag: string, label: string) {
    const link = taggedShareUrl(new URL(path, window.location.origin).toString(), tag);
    try {
      await navigator.clipboard.writeText(link);
      setStatus(`${label} link copied. Visits from it show as “${label}” in analytics.`);
    } catch {
      setStatus(`Copy this ${label} link: ${link}`);
    }
  }

  const customTag = normalizeShareTag(custom);

  return (
    <div className="share-links">
      <p className="share-links-title">Copy a tracked link for where you’ll post it</p>
      <div className="share-links-row">
        {SHARE_SOURCES.map((source) => (
          <button
            key={source.tag}
            type="button"
            onClick={() => copy(source.tag, source.label)}
          >
            {source.label}
          </button>
        ))}
      </div>
      <form
        className="share-links-custom"
        onSubmit={(event) => {
          event.preventDefault();
          if (customTag) void copy(customTag, custom.trim());
        }}
      >
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Or name it, e.g. Acme application"
          aria-label="Custom link name"
          maxLength={60}
        />
        <button type="submit" disabled={!customTag}>
          Copy
        </button>
      </form>
      {status ? (
        <p className="share-links-status" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
