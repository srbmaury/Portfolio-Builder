"use client";

import { useEffect, useState } from "react";
import type { ResumeImportDraft } from "@/lib/resume-parser";
import { validateResumeFileMetadata } from "@/lib/resume-upload";
import { trackProductEvent } from "@/lib/product-analytics";
import { useDialogFocusTrap } from "@/lib/accessibility";
import { ResumeImportReview, type ResumeImportSelection } from "./resume-import/ResumeImportReview";

export function ResumeImportDialog({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (draft: ResumeImportDraft) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ResumeImportDraft | null>(null);
  const [include, setInclude] = useState<ResumeImportSelection>({
    profile: true,
    experience: true,
    projects: true,
    skills: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(() => {
    if (!busy) onClose();
  });

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => {
      document.body.classList.remove("dialog-open");
    };
  }, []);

  function chooseFile(next?: File) {
    setError("");
    setDraft(null);

    if (!next) {
      setFile(null);
      return;
    }

    const validation = validateResumeFileMetadata(next);
    if (!validation.ok) {
      setFile(null);
      setError(validation.error);
      return;
    }

    setFile(next);
  }

  async function parseResume() {
    if (!file) {
      setError("Choose a PDF or DOCX resume first.");
      return;
    }

    setBusy(true);
    setError("");
    trackProductEvent("resume_import_started");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        draft?: ResumeImportDraft;
        error?: string;
      };

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error || "Could not parse resume.");
      }

      setDraft(payload.draft);
      trackProductEvent("resume_import_succeeded");
    } catch (parseError) {
      trackProductEvent("resume_import_failed");
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Could not parse resume."
      );
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!draft) return;

    onApply({
      profile: include.profile
        ? draft.profile
        : { socials: [] },
      experience: include.experience ? draft.experience : [],
      projects: include.projects ? draft.projects : [],
      skills: include.skills ? draft.skills : [],
    });
  }

  return (
    <div
      className="create-dialog-backdrop resume-import-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="create-dialog resume-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-import-title"
      >
        <div className="create-dialog-head">
          <div>
            <p className="panel-kicker">Resume import</p>
            <h2 id="resume-import-title">
              {draft ? "Review before applying." : "Start from your resume."}
            </h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close resume import"
          >
            ×
          </button>
        </div>

        {!draft ? (
          <div className="resume-upload-step">
            <label className="resume-dropzone">
              <strong>Choose PDF or DOCX</strong>
              <span>Maximum 5 MB. Your file is parsed in memory and is not stored.</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>

            {file ? (
              <div className="resume-file-row">
                <span>
                  <strong>{file.name}</strong>
                  <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                </span>
                <button type="button" onClick={() => chooseFile()}>
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <ResumeImportReview
            draft={draft}
            setDraft={setDraft}
            include={include}
            setInclude={setInclude}
          />
        )}

        {error ? (
          <p className="create-dialog-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="create-dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {draft ? (
            <button type="button" className="primary-button" onClick={apply}>
              Apply to portfolio
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={parseResume}
              disabled={!file || busy}
            >
              {busy ? "Reading resume…" : "Review import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
