import { redirect } from "next/navigation";
import { PortfolioManager } from "@/components/PortfolioManager";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { listPortfolios } from "@/lib/supabase/portfolio-store";
import { loadOwnerAnalytics } from "@/lib/supabase/analytics-store";

export default async function PortfoliosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const [portfolios, viewCounts] = await Promise.all([
    listPortfolios(supabase, data.user),
    loadViewCounts(supabase, data.user),
  ]);

  return (
    <PortfolioManager
      initialPortfolios={portfolios}
      viewCounts={viewCounts}
      email={data.user.email ?? null}
      isAdmin={isAdminEmail(data.user.email)}
    />
  );
}

// View counts are a nice-to-have on this page; if analytics cannot be read,
// the manager still renders and simply leaves the counts out.
async function loadViewCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: Parameters<typeof loadOwnerAnalytics>[1]
) {
  try {
    const { comparison } = await loadOwnerAnalytics(supabase, user, 30);
    return Object.fromEntries(
      comparison.map((row) => [
        row.variantKey,
        { views: row.views, uniqueVisitors: row.uniqueVisitors },
      ])
    );
  } catch {
    return null;
  }
}
