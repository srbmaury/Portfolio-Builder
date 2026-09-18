import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  summarizeAnalytics,
  type AnalyticsEventRow,
  type AnalyticsPortfolioRow,
  type AnalyticsSummary,
  type PortfolioAnalyticsRow,
} from "@/lib/analytics";

export type OwnerAnalyticsData = {
  days: 7 | 30 | 90;
  selectedVariantKey: string | null;
  analytics: AnalyticsSummary;
  comparison: PortfolioAnalyticsRow[];
  portfolios: AnalyticsPortfolioRow[];
};

export async function loadOwnerAnalytics(
  supabase: SupabaseClient,
  user: User,
  days: number,
  variantKey?: string | null
): Promise<OwnerAnalyticsData> {
  const normalizedDays = normalizeAnalyticsDays(days);
  const start = new Date(
    Date.now() - (normalizedDays - 1) * 24 * 60 * 60 * 1000
  );
  start.setUTCHours(0, 0, 0, 0);

  const { data: portfolioRows, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id, variant_key, name, is_published, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (portfolioError) throw portfolioError;

  const portfolios: AnalyticsPortfolioRow[] = (portfolioRows || []).map(
    (row) => ({
      id: row.id,
      variantKey: row.variant_key,
      name: row.name || "Untitled portfolio",
      isPublished: Boolean(row.is_published),
    })
  );

  if (!portfolios.length) {
    return {
      days: normalizedDays,
      selectedVariantKey: null,
      analytics: summarizeAnalytics([], []),
      comparison: [],
      portfolios: [],
    };
  }

  const portfolioIds = portfolios.map((portfolio) => portfolio.id);
  const { data: eventRows, error: eventError } = await supabase
    .from("analytics_events")
    .select(
      "portfolio_id, event_type, visitor_id, session_id, target, referrer_host, device_type, created_at"
    )
    .in("portfolio_id", portfolioIds)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: true });

  if (eventError) throw eventError;

  const events = (eventRows || []) as AnalyticsEventRow[];
  const all = summarizeAnalytics(events, portfolios);
  const selectedPortfolio =
    variantKey && portfolios.some((portfolio) => portfolio.variantKey === variantKey)
      ? portfolios.find((portfolio) => portfolio.variantKey === variantKey) || null
      : null;

  const analytics = selectedPortfolio
    ? summarizeAnalytics(
        events.filter((event) => event.portfolio_id === selectedPortfolio.id),
        [selectedPortfolio]
      )
    : all;

  return {
    days: normalizedDays,
    selectedVariantKey: selectedPortfolio?.variantKey || null,
    analytics,
    comparison: all.portfolios,
    portfolios,
  };
}

export function normalizeAnalyticsDays(value: number): 7 | 30 | 90 {
  if (value === 7 || value === 90) return value;
  return 30;
}
