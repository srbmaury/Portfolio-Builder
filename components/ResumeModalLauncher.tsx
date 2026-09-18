"use client";

import { useEffect, useRef, useState } from "react";

export function ResumeModalLauncher({
  url,
  fileName,
  label = "View résumé",
  className,
}: {
  url: string;
  fileName: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const activeDialog = dialog;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
        )
      );

    focusable()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("dialog-open");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("dialog-open");
      (previous || triggerRef.current)?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className || "hero-resume-link"}
        onClick={() => setOpen(true)}
        data-analytics-event="resume_opened"
        data-analytics-target="resume"
      >
        {label}
      </button>

      {open ? (
        <div
          className="resume-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            className="resume-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${fileName || "Resume"} preview`}
          >
            <div className="resume-modal-head">
              <div>
                <span>Résumé</span>
                <strong>{fileName || "Resume.pdf"}</strong>
              </div>
              <div className="resume-modal-actions">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  data-analytics-event="resume_opened"
                  data-analytics-target="resume"
                >
                  Open in new tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close resume"
                >
                  ×
                </button>
              </div>
            </div>
            <iframe
              src={url}
              title={`${fileName || "Resume"} PDF`}
              className="resume-modal-frame"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
