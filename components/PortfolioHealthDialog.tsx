"use client";

import { useEffect, useMemo } from "react";
import { useDialogFocusTrap } from "@/lib/accessibility";
import {
  analyzePortfolioHealth,
  type PortfolioHealthSeverity,
  type PortfolioHealthTab,
} from "@/lib/portfolio-health";
import type { BuilderState } from "@/lib/portfolio";

const labels: Record<PortfolioHealthSeverity, string> = {
  error: "Needs attention",
  warning: "Improve",
  suggestion: "Optional",
};

export function PortfolioHealthDialog({
  state,
  onClose,
  onNavigate,
}: {
  state: BuilderState;
  onClose: () => void;
  onNavigate: (tab: PortfolioHealthTab) => void;
}) {
  const report = useMemo(() => analyzePortfolioHealth(state), [state]);
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(onClose);

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => document.body.classList.remove("dialog-open");
  }, []);

  const statusTitle =
    report.status === "needs-attention"
      ? "A few things need attention"
      : report.status === "good"
        ? "Good foundation"
        : "Ready to publish";

  const statusDetail =
    report.status === "needs-attention"
      ? "Fix the highest-priority items first, then work through the improvements that matter for this portfolio."
      : report.status === "good"
        ? "Nothing fundamental is missing. A few improvements can make the portfolio stronger."
        : "No obvious content, targeting, link, or layout issues were detected.";

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
        className="create-dialog portfolio-health-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-health-title"
      >
        <div className="create-dialog-head">
          <div>
            <p className="panel-kicker">Portfolio health</p>
            <h2 id="portfolio-health-title">{statusTitle}</h2>
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

        <div className="create-dialog-body portfolio-health-body">
          <p className="portfolio-health-summary">{statusDetail}</p>

          <div className="portfolio-health-counts">
            <HealthCount
              label="Needs attention"
              value={report.counts.error}
              severity="error"
            />
            <HealthCount
              label="Improvements"
              value={report.counts.warning}
              severity="warning"
            />
            <HealthCount
              label="Optional"
              value={report.counts.suggestion}
              severity="suggestion"
            />
          </div>

          {report.issues.length ? (
            <div className="portfolio-health-list">
              {report.issues.map((item) => (
                <div
                  key={item.id}
                  className={`portfolio-health-item severity-${item.severity}`}
                >
                  <div className="portfolio-health-item-copy">
                    <span>{labels[item.severity]}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onNavigate(item.tab)}
                  >
                    Open {tabLabel(item.tab)}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="portfolio-health-empty">
              <strong>No obvious issues found.</strong>
              <p>
                You can still review the live preview before publishing, but
                the structured content checks are clear.
              </p>
            </div>
          )}
        </div>

        <div className="create-dialog-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function HealthCount({
  label,
  value,
  severity,
}: {
  label: string;
  value: number;
  severity: PortfolioHealthSeverity;
}) {
  return (
    <div className={`portfolio-health-count severity-${severity}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function tabLabel(tab: PortfolioHealthTab) {
  if (tab === "targeting") return "Targeting";
  if (tab === "design") return "Design";
  return "Content";
}
