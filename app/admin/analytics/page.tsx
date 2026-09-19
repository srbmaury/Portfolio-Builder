import { notFound, redirect } from "next/navigation";
import {
  AdminAnalyticsDashboard,
  type AdminAnalyticsData,
} from "@/components/AdminAnalyticsDashboard";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { normalizeAnalyticsDays } from "@/lib/supabase/analytics-store";

type Props = {
  searchParams?: Promise<{ days?: string | string[] }>;
};

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  if (!isAdminEmail(data.user.email)) {
    notFound();
  }

  const params = (await searchParams) || {};
  const rawDays = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = normalizeAnalyticsDays(Number(rawDays || 30));

  const { data: analytics, error: analyticsError } =
    await supabase.functions.invoke("admin-analytics", {
      body: { days },
    });

  if (analyticsError || !analytics) {
    throw new Error("Admin analytics could not be loaded.");
  }

  return (
    <AdminAnalyticsDashboard data={analytics as AdminAnalyticsData} />
  );
}
