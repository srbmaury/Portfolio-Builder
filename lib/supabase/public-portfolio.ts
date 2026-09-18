import { createPublicClient } from "@/lib/supabase/public";
import type { PortfolioSnapshot } from "@/lib/portfolio";

export type PublishedPortfolio = {
  id: string;
  snapshot: PortfolioSnapshot;
};

export async function loadPublishedPortfolio(
  username: string,
  portfolio: string
): Promise<PublishedPortfolio | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, published_snapshot")
    .eq("public_path", `${username}/${portfolio}`)
    .maybeSingle();

  if (error || !data?.id || !data.published_snapshot) return null;

  return {
    id: data.id,
    snapshot: data.published_snapshot as PortfolioSnapshot,
  };
}

export async function loadPublishedSnapshot(
  username: string,
  portfolio: string
): Promise<PortfolioSnapshot | null> {
  const published = await loadPublishedPortfolio(username, portfolio);
  return published?.snapshot || null;
}

export function safePublishedImageUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
