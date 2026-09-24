import { isTaggedSource } from "./share-links.ts";

export const ANALYTICS_EVENT_TYPES = [
  "portfolio_view",
  "resume_opened",
  "contact_clicked",
  "project_clicked",
  "social_clicked",
  "custom_link_clicked",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
export type AnalyticsDeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export type NormalizedAnalyticsEventInput = {
  portfolioId: string;
  eventType: AnalyticsEventType;
  visitorId: string;
  sessionId: string;
  target: string | null;
  referrerHost: string;
  deviceType: AnalyticsDeviceType;
};

export type AnalyticsEventRow = {
  portfolio_id: string;
  event_type: AnalyticsEventType;
  visitor_id: string;
  session_id: string;
  target: string | null;
  referrer_host: string | null;
  device_type: AnalyticsDeviceType;
  created_at: string;
};

export type AnalyticsPortfolioRow = {
  id: string;
  variantKey: string;
  name: string;
  isPublished: boolean;
};

export type AnalyticsMetricSummary = {
  views: number;
  uniqueVisitors: number;
  engagedVisitors: number;
  engagementRate: number;
  resumeOpens: number;
  contactClicks: number;
  projectClicks: number;
  socialClicks: number;
  customLinkClicks: number;
};

export type AnalyticsBreakdown = {
  label: string;
  count: number;
};

export type AnalyticsDailyRow = {
  date: string;
  views: number;
  uniqueVisitors: number;
  engagements: number;
};

export type PortfolioAnalyticsRow = AnalyticsMetricSummary & {
  id: string;
  variantKey: string;
  name: string;
  isPublished: boolean;
};

export type AnalyticsSummary = {
  summary: AnalyticsMetricSummary;
  daily: AnalyticsDailyRow[];
  referrers: AnalyticsBreakdown[];
  devices: AnalyticsBreakdown[];
  actions: AnalyticsBreakdown[];
  portfolios: PortfolioAnalyticsRow[];
};

export type NormalizeAnalyticsResult =
  | { ok: true; value: NormalizedAnalyticsEventInput }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TARGET_RE = /^[a-zA-Z0-9:._-]{1,120}$/;
const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/i;
const DEVICE_TYPES = new Set<AnalyticsDeviceType>([
  "desktop",
  "mobile",
  "tablet",
  "unknown",
]);

export function normalizeAnalyticsEventInput(
  input: unknown
): NormalizeAnalyticsResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid analytics event." };
  }

  const value = input as Record<string, unknown>;
  const portfolioId = stringValue(value.portfolioId);
  const visitorId = stringValue(value.visitorId);
  const sessionId = stringValue(value.sessionId);
  const eventType = stringValue(value.eventType) as AnalyticsEventType;
  const deviceType = stringValue(value.deviceType) as AnalyticsDeviceType;
  const rawTarget = stringValue(value.target);
  const rawHost = stringValue(value.referrerHost).toLowerCase();

  if (!UUID_RE.test(portfolioId)) {
    return { ok: false, error: "Invalid portfolio id." };
  }

  if (!UUID_RE.test(visitorId) || !UUID_RE.test(sessionId)) {
    return { ok: false, error: "Invalid anonymous analytics id." };
  }

  if (!ANALYTICS_EVENT_TYPES.includes(eventType)) {
    return { ok: false, error: "Unsupported analytics event." };
  }

  if (!DEVICE_TYPES.has(deviceType)) {
    return { ok: false, error: "Unsupported device type." };
  }

  if (rawTarget && !TARGET_RE.test(rawTarget)) {
    return { ok: false, error: "Invalid analytics target." };
  }

  if (
    rawHost &&
    !isTaggedSource(rawHost) &&
    (rawHost.length > 255 || !HOST_RE.test(rawHost))
  ) {
    return { ok: false, error: "Invalid referrer host." };
  }

  return {
    ok: true,
    value: {
      portfolioId,
      eventType,
      visitorId,
      sessionId,
      target: rawTarget || null,
      referrerHost: rawHost,
      deviceType,
    },
  };
}

export function summarizeAnalytics(
  events: AnalyticsEventRow[],
  portfolios: AnalyticsPortfolioRow[]
): AnalyticsSummary {
  const summary = summarizeMetricBlock(events);

  const dayMap = new Map<
    string,
    { views: number; visitors: Set<string>; engagements: number }
  >();
  const referrerMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();

  for (const event of events) {
    const date = event.created_at.slice(0, 10);
    let day = dayMap.get(date);
    if (!day) {
      day = { views: 0, visitors: new Set(), engagements: 0 };
      dayMap.set(date, day);
    }

    if (event.event_type === "portfolio_view") {
      day.views += 1;
      day.visitors.add(event.visitor_id);

      const referrer = event.referrer_host?.trim() || "Direct";
      referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);

      const device = event.device_type || "unknown";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    } else {
      day.engagements += 1;
    }
  }

  const daily = [...dayMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date,
      views: value.views,
      uniqueVisitors: value.visitors.size,
      engagements: value.engagements,
    }));

  const perPortfolio = portfolios.map((portfolio) => ({
    ...portfolio,
    ...summarizeMetricBlock(
      events.filter((event) => event.portfolio_id === portfolio.id)
    ),
  }));

  return {
    summary,
    daily,
    referrers: mapBreakdown(referrerMap),
    devices: mapBreakdown(deviceMap),
    actions: actionBreakdown(events),
    portfolios: perPortfolio,
  };
}

export function analyticsSocialTarget(label: string, url: string) {
  const value = `${label} ${url}`.toLowerCase();
  if (value.includes("github")) return "github";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("twitter") || value.includes("x.com")) return "x";
  return "website";
}

function summarizeMetricBlock(events: AnalyticsEventRow[]): AnalyticsMetricSummary {
  const viewVisitors = new Set<string>();
  const engagedVisitors = new Set<string>();
  let views = 0;
  let resumeOpens = 0;
  let contactClicks = 0;
  let projectClicks = 0;
  let socialClicks = 0;
  let customLinkClicks = 0;

  for (const event of events) {
    if (event.event_type === "portfolio_view") {
      views += 1;
      viewVisitors.add(event.visitor_id);
      continue;
    }

    engagedVisitors.add(event.visitor_id);

    switch (event.event_type) {
      case "resume_opened":
        resumeOpens += 1;
        break;
      case "contact_clicked":
        contactClicks += 1;
        break;
      case "project_clicked":
        projectClicks += 1;
        break;
      case "social_clicked":
        socialClicks += 1;
        break;
      case "custom_link_clicked":
        customLinkClicks += 1;
        break;
    }
  }

  const uniqueVisitors = viewVisitors.size;
  const engagedVisitorCount = [...engagedVisitors].filter((visitorId) =>
    viewVisitors.has(visitorId)
  ).length;

  return {
    views,
    uniqueVisitors,
    engagedVisitors: engagedVisitorCount,
    engagementRate:
      uniqueVisitors === 0
        ? 0
        : Math.round((engagedVisitorCount / uniqueVisitors) * 1000) / 10,
    resumeOpens,
    contactClicks,
    projectClicks,
    socialClicks,
    customLinkClicks,
  };
}

function actionBreakdown(events: AnalyticsEventRow[]): AnalyticsBreakdown[] {
  const counts = new Map<AnalyticsEventType, number>();

  for (const event of events) {
    if (event.event_type === "portfolio_view") continue;
    counts.set(event.event_type, (counts.get(event.event_type) || 0) + 1);
  }

  const ordered: Array<[AnalyticsEventType, string]> = [
    ["project_clicked", "Project clicks"],
    ["resume_opened", "Resume opens"],
    ["contact_clicked", "Contact clicks"],
    ["social_clicked", "Social clicks"],
    ["custom_link_clicked", "Custom link clicks"],
  ];

  return ordered
    .map(([type, label]) => ({ label, count: counts.get(type) || 0 }))
    .filter((item) => item.count > 0);
}

function mapBreakdown(values: Map<string, number>): AnalyticsBreakdown[] {
  return [...values.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
