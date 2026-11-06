import { useEffect, useRef, useState, type RefObject } from "react";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import type { PreviewMode } from "./types";

type Props = {
  snapshot: PortfolioSnapshot;
  portfolioName?: string;
  builderResumeUrl?: string;
  visibleSections: number;
  previewStageRef: RefObject<HTMLElement | null>;
  onResumeImport: () => void;
};

export function BuilderPreview({
  snapshot,
  portfolioName,
  builderResumeUrl,
  visibleSections,
  previewStageRef,
  onResumeImport,
}: Props) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  function sendPreviewPayload() {
    previewFrameRef.current?.contentWindow?.postMessage(
      {
        type: "folioblocks:preview",
        snapshot,
        publicResumeUrl: builderResumeUrl,
      },
      window.location.origin
    );
  }

  useEffect(() => {
    function handlePreviewReady(event: MessageEvent<{ type?: string }>) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== previewFrameRef.current?.contentWindow) return;
      if (event.data?.type !== "folioblocks:preview-ready") return;
      sendPreviewPayload();
    }

    window.addEventListener("message", handlePreviewReady);
    sendPreviewPayload();

    return () => window.removeEventListener("message", handlePreviewReady);
  }, [snapshot, builderResumeUrl]);

  return (
    <section className="preview-stage" ref={previewStageRef}>
      <div className="preview-toolbar">
        <div>
          <span>Live preview</span>
          <strong>{portfolioName || "Untitled"}</strong>
        </div>

        <div className="preview-controls">
          {(["desktop", "tablet", "mobile"] as PreviewMode[]).map((mode) => (
            <button
              key={mode}
              className={previewMode === mode ? "active" : ""}
              onClick={() => setPreviewMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        <span>
          {snapshot.config.theme} theme · {visibleSections} sections ·{" "}
          {previewMode === "desktop"
            ? "responsive"
            : previewMode === "tablet"
              ? "768 × 1024"
              : "390 × 844"}
        </span>
      </div>

      <div className="preview-canvas">
        <div className={`preview-window preview-${previewMode}`}>
          <iframe
            ref={previewFrameRef}
            className="preview-device-frame"
            src="/builder/preview"
            title={`${previewMode} portfolio preview`}
            onLoad={sendPreviewPayload}
          />
          {visibleSections === 0 && (
            <div className="preview-empty" role="status">
              <strong>Your portfolio will appear here</strong>
              <p>
                Add your name and role on the left, or import your résumé to
                fill most of it in one step.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={onResumeImport}
              >
                Import résumé
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
