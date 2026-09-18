import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { siteOrigin } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("portfolios")
    .select("public_path, updated_at")
    .eq("is_published", true)
    .not("public_path", "is", null)
    .order("updated_at", { ascending: false });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/docs`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const portfolioPages: MetadataRoute.Sitemap = (data || [])
    .filter((row) => Boolean(row.public_path))
    .map((row) => ({
      url: `${origin}/${row.public_path}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticPages, ...portfolioPages];
}
