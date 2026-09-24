"use client";

import { useEffect } from "react";
import { useDialogFocusTrap } from "@/lib/accessibility";

export function QuickStartDialog({
  onResume,
  onGitHub,
  onManual,
}: {
  onResume: () => void;
  onGitHub: () => void;
  onManual: () => void;
}) {
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(onManual);

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => document.body.classList.remove("dialog-open");
  }, []);

  return (
    <div className="create-dialog-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="create-dialog quick-start-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-start-title"
      >
        <div className="quick-start-heading">
          <p className="panel-kicker">Fastest way to publish</p>
          <h2 id="quick-start-title">How do you want to start?</h2>
          <p>
            Import what you already have, then edit anything in the builder before
            you publish.
          </p>
        </div>

        <div className="quick-start-options">
          <button type="button" className="quick-start-option primary" onClick={onResume}>
            <span className="quick-start-option-badge">Recommended</span>
            <strong>Upload résumé</strong>
            <small>
              Prefill your profile, experience, projects, and skills from a PDF or DOCX.
            </small>
          </button>

          <button type="button" className="quick-start-option" onClick={onGitHub}>
            <strong>Import GitHub</strong>
            <small>
              Pick public repositories and bring in project names, links, languages,
              and topics.
            </small>
          </button>

          <button type="button" className="quick-start-option" onClick={onManual}>
            <strong>Start manually</strong>
            <small>Open the full editor and fill in each section yourself.</small>
          </button>
        </div>

        <p className="quick-start-foot">
          Nothing is published until you press Publish.
        </p>
      </div>
    </div>
  );
}
