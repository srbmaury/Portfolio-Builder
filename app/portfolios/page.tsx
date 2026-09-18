import { redirect } from "next/navigation";
import { PortfolioManager } from "@/components/PortfolioManager";
import { createClient } from "@/lib/supabase/server";
import { listPortfolios } from "@/lib/supabase/portfolio-store";

export default async function PortfoliosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const portfolios = await listPortfolios(supabase, data.user);

  return <PortfolioManager initialPortfolios={portfolios} />;
}
