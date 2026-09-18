"use client";

import { useEffect, useState } from "react";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import type { PortfolioSnapshot } from "@/lib/portfolio";

type PreviewPayload = {
  type: "folioblocks:preview";
  snapshot: PortfolioSnapshot;
  publicResumeUrl?: string;
};

export function BuilderPreviewPage() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent<PreviewPayload>) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window.parent) return;
      if (event.data?.type !== "folioblocks:preview") return;
      if (!event.data.snapshot) return;

      setPayload(event.data);
    }

    window.addEventListener("message", handleMessage);
    window.parent.postMessage(
      { type: "folioblocks:preview-ready" },
      window.location.origin
    );

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!payload) {
    return (
      <main className="builder-preview-loading" aria-label="Loading portfolio preview">
        <span>Loading preview…</span>
      </main>
    );
  }

  return (
    <main className="builder-preview-page">
      <PortfolioRenderer
        snapshot={payload.snapshot}
        publicResumeUrl={payload.publicResumeUrl}
      />
    </main>
  );
}
