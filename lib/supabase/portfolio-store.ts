import type { SupabaseClient, User } from "@supabase/supabase-js";
import { slugify } from "@/lib/portfolio";

export type PortfolioSummary = {
  variantKey: string;
  name: string;
  targetRole: string;
  theme: string;
  isPublished: boolean;
  publishedAt: string | null;
  publicPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listPortfolios(
  supabase: SupabaseClient,
  user: User
): Promise<PortfolioSummary[]> {
  const { data, error } = await supabase
    .from("portfolios")
    .select(
      "variant_key, name, target_role, theme, is_published, published_at, public_path, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at");

  if (error) throw error;

  return (data || []).map((row) => ({
    variantKey: row.variant_key,
    name: row.name,
    targetRole: row.target_role,
    theme: row.theme,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    publicPath: row.public_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}


export async function renamePortfolio(
  supabase: SupabaseClient,
  user: User,
  variantKey: string,
  name: string
) {
  const nextName = name.trim();
  if (!nextName) throw new Error("Portfolio name cannot be empty.");

  const { error } = await supabase
    .from("portfolios")
    .update({ name: nextName })
    .eq("user_id", user.id)
    .eq("variant_key", variantKey);

  if (error) throw error;
}

export async function deletePortfolio(
  _supabase: SupabaseClient,
  _user: User,
  variantKey: string
) {
  const response = await fetch(
    `/api/portfolios/${encodeURIComponent(variantKey)}`,
    { method: "DELETE" }
  );

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    deletedSharedWorkspace?: boolean;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Portfolio deletion failed.");
  }

  return payload;
}

export async function duplicatePortfolio(
  supabase: SupabaseClient,
  user: User,
  variantKey: string
) {
  const [{ data: source, error: sourceError }, { data: existing, error: existingError }] =
    await Promise.all([
      supabase
        .from("portfolios")
        .select("name, target_role, theme, section_config, content_config, branding_config, resume_config")
        .eq("user_id", user.id)
        .eq("variant_key", variantKey)
        .single(),
      supabase
        .from("portfolios")
        .select("slug")
        .eq("user_id", user.id),
    ]);

  if (sourceError) throw sourceError;
  if (existingError) throw existingError;

  const name = `${source.name} Copy`;
  const usedSlugs = new Set((existing || []).map((row) => row.slug));
  const rawBase = slugify(name).slice(0, 40) || "portfolio-copy";
  let slug = rawBase;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    const suffixText = `-${suffix++}`;
    slug = `${rawBase.slice(0, 40 - suffixText.length)}${suffixText}`;
  }

  const newVariantKey = `portfolio-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const { error } = await supabase.from("portfolios").insert({
    user_id: user.id,
    variant_key: newVariantKey,
    name,
    slug,
    target_role: source.target_role,
    theme: source.theme,
    section_config: source.section_config,
    content_config: source.content_config,
    branding_config: source.branding_config || {},
    resume_config: source.resume_config || {},
    is_published: false,
  });

  if (error) throw error;
  return newVariantKey;
}
