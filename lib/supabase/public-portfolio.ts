import { createPublicClient } from "@/lib/supabase/public";
import type { PortfolioSnapshot } from "@/lib/portfolio";

export async function loadPublishedSnapshot(
  username: string,
  portfolio: string
): Promise<PortfolioSnapshot | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("published_snapshot")
    .eq("public_path", `${username}/${portfolio}`)
    .maybeSingle();

  if (error || !data?.published_snapshot) return null;
  return data.published_snapshot as PortfolioSnapshot;
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
