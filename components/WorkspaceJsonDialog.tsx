"use client";

import { useEffect, useState } from "react";
import type { BuilderState } from "@/lib/portfolio";
import {
  formatWorkspaceJson,
  parseWorkspaceJson,
} from "@/lib/workspace-json";

export function WorkspaceJsonDialog({
  state,
  onClose,
  onApply,
}: {
  state: BuilderState;
  onClose: () => void;
  onApply: (state: BuilderState) => void;
}) {
  const original = JSON.stringify(state, null, 2);
  const [text, setText] = useState(original);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("dialog-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("dialog-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function format() {
    const result = formatWorkspaceJson(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setText(result.text);
  }

  function apply() {
    const result = parseWorkspaceJson(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError("");
    onApply(result.state);
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
        className="create-dialog workspace-json-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-json-title"
      >
        <div className="create-dialog-head">
          <div>
            <p className="panel-kicker">Advanced editor</p>
            <h2 id="workspace-json-title">Edit workspace as JSON</h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="Close JSON editor"
          >
            ×
          </button>
        </div>

        <p className="workspace-json-help">
          This is the complete FolioBlocks workspace: shared content, variants,
          targeting, design, branding, and custom sections. Invalid JSON is never
          applied.
        </p>

        <textarea
          className="workspace-json-textarea"
          value={text}
          spellCheck={false}
          onChange={(event) => {
            setError("");
            setText(event.target.value);
          }}
          aria-label="Workspace JSON"
        />

        {error ? (
          <p className="create-dialog-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="workspace-json-toolbar">
          <button type="button" onClick={format}>
            Format JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setText(original);
            }}
          >
            Reset
          </button>
        </div>

        <div className="create-dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={apply}>
            Apply changes
          </button>
        </div>
      </div>
    </div>
  );
}
