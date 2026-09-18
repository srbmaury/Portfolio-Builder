import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { createClient } from "@/lib/supabase/server";
import {
  loadOwnerAnalytics,
  normalizeAnalyticsDays,
} from "@/lib/supabase/analytics-store";

type Props = {
  searchParams?: Promise<{
    days?: string | string[];
    portfolio?: string | string[];
  }>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const params = (await searchParams) || {};
  const daysValue = Array.isArray(params.days) ? params.days[0] : params.days;
  const portfolioValue = Array.isArray(params.portfolio)
    ? params.portfolio[0]
    : params.portfolio;
  const days = normalizeAnalyticsDays(Number(daysValue || 30));

  const analytics = await loadOwnerAnalytics(
    supabase,
    data.user,
    days,
    portfolioValue || null
  );

  return <AnalyticsDashboard data={analytics} />;
}
