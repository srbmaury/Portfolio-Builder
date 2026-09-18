"use client";

import { useEffect } from "react";
import type {
  AnalyticsDeviceType,
  AnalyticsEventType,
} from "@/lib/analytics";

const VISITOR_KEY = "folioblocks:analytics:visitor";
const SESSION_KEY = "folioblocks:analytics:session";

export function PortfolioAnalyticsTracker({
  portfolioId,
}: {
  portfolioId: string;
}) {
  useEffect(() => {
    const visitorId = getOrCreateId(window.localStorage, VISITOR_KEY);
    const sessionId = getOrCreateId(window.sessionStorage, SESSION_KEY);
    const deviceType = detectDeviceType();
    const referrerHost = safeReferrerHost(document.referrer);

    recordEvent({
      portfolioId,
      eventType: "portfolio_view",
      visitorId,
      sessionId,
      target: null,
      referrerHost,
      deviceType,
    });

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const tracked = target.closest<HTMLElement>("[data-analytics-event]");
      if (!tracked) return;

      const eventType = tracked.dataset.analyticsEvent as AnalyticsEventType | undefined;
      if (!eventType) return;

      recordEvent({
        portfolioId,
        eventType,
        visitorId,
        sessionId,
        target: tracked.dataset.analyticsTarget || null,
        referrerHost,
        deviceType,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [portfolioId]);

  return null;
}

function recordEvent(input: {
  portfolioId: string;
  eventType: AnalyticsEventType;
  visitorId: string;
  sessionId: string;
  target: string | null;
  referrerHost: string;
  deviceType: AnalyticsDeviceType;
}) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the public portfolio experience.
  });
}

function getOrCreateId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}

function safeReferrerHost(value: string) {
  if (!value) return "";

  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === window.location.hostname.toLowerCase() ? "" : host;
  } catch {
    return "";
  }
}

function detectDeviceType(): AnalyticsDeviceType {
  const agent = navigator.userAgent;

  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(agent)) {
    return "tablet";
  }

  if (/Mobi|iPhone|Android/i.test(agent)) {
    return "mobile";
  }

  return "desktop";
}
