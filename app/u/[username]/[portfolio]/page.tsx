import { notFound } from "next/navigation";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioSnapshot } from "@/lib/portfolio";

type Props = {
  params: Promise<{ username: string; portfolio: string }>;
};

export default async function PublicPortfolioPage({ params }: Props) {
  const { username, portfolio } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("portfolios")
    .select("published_snapshot")
    .eq("public_path", `${username}/${portfolio}`)
    .maybeSingle();

  if (error || !data?.published_snapshot) notFound();

  return <PortfolioRenderer snapshot={data.published_snapshot as PortfolioSnapshot} />;
}
