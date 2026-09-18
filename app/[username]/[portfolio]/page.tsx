import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { createPublicClient } from "@/lib/supabase/public";
import type { PortfolioSnapshot } from "@/lib/portfolio";

type Props = {
  params: Promise<{ username: string; portfolio: string }>;
};

async function loadPublishedSnapshot(username: string, portfolio: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("published_snapshot")
    .eq("public_path", `${username}/${portfolio}`)
    .maybeSingle();

  if (error || !data?.published_snapshot) return null;
  return data.published_snapshot as PortfolioSnapshot;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, portfolio } = await params;
  const snapshot = await loadPublishedSnapshot(username, portfolio);

  if (!snapshot) {
    return {
      title: "Portfolio not found — FolioBlocks",
    };
  }

  return {
    title: `${snapshot.data.profile.name} — ${snapshot.meta?.targetRole || snapshot.data.profile.role}`,
    description: snapshot.data.profile.tagline,
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { username, portfolio } = await params;
  const snapshot = await loadPublishedSnapshot(username, portfolio);

  if (!snapshot) notFound();

  return <PortfolioRenderer snapshot={snapshot} />;
}
