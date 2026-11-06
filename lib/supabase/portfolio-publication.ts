import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  cloneConfig,
  fullContentConfig,
  normalizeBuilderState,
  publicUsernameForProfile,
  snapshotForVariant,
} from "@/lib/portfolio";
import type { BuilderState, PortfolioSnapshot } from "@/lib/portfolio";
import { loadBuilderState, saveBuilderState } from "./workspace-store";
import { slugForVariant } from "./portfolio-slug";

/** PostgREST reports an unknown column as PGRST204 with the name in the message. */
function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === "PGRST204" &&
    typeof message === "string" &&
    message.includes(column)
  );
}

export async function publishVariant(
  supabase: SupabaseClient,
  user: User,
  state: BuilderState
) {
  const normalized = normalizeBuilderState(state);
  const active =
    normalized.variants.find(
      (variant) => variant.id === normalized.activeVariantId
    ) || normalized.variants[0];

  if (!active) throw new Error("No portfolio variant selected.");

  const username = await ensureProfile(supabase, user, normalized);
  const { data: existing, error: existingError } = await supabase
    .from("portfolios")
    .select("slug, public_path")
    .eq("user_id", user.id)
    .eq("variant_key", active.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const slug = existing?.slug || slugForVariant(normalized.variants, active);
  const publicPath = existing?.public_path || `${username}/${slug}`;
  const snapshot = snapshotForVariant(normalized);

  // published_at and updated_at are written together so "has this portfolio
  // changed since it was published" is a comparison of two values from the
  // same clock. Leaving updated_at to the database made it a client clock
  // against a server one, and the page always looked out of date.
  const publishedAt = new Date().toISOString();

  const row = {
    user_id: user.id,
    variant_key: active.id,
    name: active.name,
    slug,
    target_role: active.targetRole,
    theme: active.config.theme,
    section_config: cloneConfig(active.config).sections,
    content_config: active.content,
    data_config: active.data,
    branding_config: active.branding,
    resume_config: active.resume,
    is_published: true,
    published_at: publishedAt,
    updated_at: publishedAt,
    public_path: publicPath,
    published_snapshot: snapshot,
  };

  const { error } = await supabase
    .from("portfolios")
    .upsert(row, { onConflict: "user_id,variant_key" });

  if (error) {
    // data_config arrives with the per-portfolio content migration. Publishing
    // must keep working against a database that has not had it applied yet,
    // rather than failing on a column the deployment has not reached.
    if (isMissingColumnError(error, "data_config")) {
      const { data_config: _ignored, ...withoutData } = row;
      const retry = await supabase
        .from("portfolios")
        .upsert(withoutData, { onConflict: "user_id,variant_key" });

      if (retry.error) throw retry.error;
      return publicPath;
    }

    throw error;
  }

  return publicPath;
}

/**
 * Puts the workspace copy of one portfolio back to what its public page is
 * serving. Publishing freezes a snapshot, so the two drift apart as soon as
 * the portfolio is edited; this is the way back for an edit you did not mean
 * to keep. Only the named portfolio is touched.
 */
export async function restorePublishedSnapshot(
  supabase: SupabaseClient,
  user: User,
  variantKey: string
): Promise<BuilderState> {
  const { data: row, error } = await supabase
    .from("portfolios")
    .select("published_snapshot")
    .eq("user_id", user.id)
    .eq("variant_key", variantKey)
    .maybeSingle();

  if (error) throw error;

  const snapshot = row?.published_snapshot as PortfolioSnapshot | null;
  if (!snapshot?.data || !snapshot?.config) {
    throw new Error("This portfolio has no published version to restore.");
  }

  const state = await loadBuilderState(supabase, user);
  if (!state) throw new Error("Could not load your workspace.");

  const restored = normalizeBuilderState({
    ...state,
    activeVariantId: variantKey,
    variants: state.variants.map((variant) =>
      variant.id === variantKey
        ? {
            ...variant,
            name: snapshot.meta?.name ?? variant.name,
            targetRole: snapshot.meta?.targetRole ?? variant.targetRole,
            // The snapshot already holds exactly what the page shows, so the
            // restored portfolio includes all of it.
            data: snapshot.data,
            content: fullContentConfig(snapshot.data),
            config: snapshot.config,
            branding: snapshot.meta?.branding ?? variant.branding,
            resume: snapshot.meta?.resume ?? variant.resume,
          }
        : variant
    ),
  });

  await saveBuilderState(supabase, user, restored);
  return restored;
}

export async function unpublishPortfolio(
  supabase: SupabaseClient,
  user: User,
  variantKey: string
) {
  const { error } = await supabase
    .from("portfolios")
    .update({
      is_published: false,
      published_at: null,
      published_snapshot: null,
    })
    .eq("user_id", user.id)
    .eq("variant_key", variantKey);

  if (error) throw error;
}

export async function publishPortfolioByKey(
  supabase: SupabaseClient,
  user: User,
  variantKey: string
) {
  const state = await loadBuilderState(supabase, user);
  if (!state) throw new Error("No saved portfolio workspace found.");

  if (!state.variants.some((variant) => variant.id === variantKey)) {
    throw new Error("Portfolio not found.");
  }

  return publishVariant(supabase, user, {
    ...state,
    activeVariantId: variantKey,
  });
}

async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  state: BuilderState
) {
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const username = publicUsernameForProfile(
    existing?.username,
    state.data.profile.name,
    user.id
  );
  const usernameChanged = Boolean(
    existing?.username && existing.username !== username
  );

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    username,
    full_name: state.data.profile.name,
    role: state.data.profile.role,
    tagline: state.data.profile.tagline,
    about: state.data.profile.about,
    email: state.data.profile.email || user.email || "",
    location: state.data.profile.location,
    availability: state.data.profile.availability,
    hero_image_url: state.data.profile.heroImageUrl || "",
    social_links: state.data.profile.socials,
    custom_sections: state.data.customSections,
  });

  if (error) throw error;

  if (usernameChanged) {
    const { data: portfolios, error: portfolioError } = await supabase
      .from("portfolios")
      .select("variant_key, slug, public_path")
      .eq("user_id", user.id);

    if (portfolioError) throw portfolioError;

    for (const portfolio of portfolios || []) {
      if (!portfolio.public_path) continue;

      const { error: pathError } = await supabase
        .from("portfolios")
        .update({ public_path: `${username}/${portfolio.slug}` })
        .eq("user_id", user.id)
        .eq("variant_key", portfolio.variant_key);

      if (pathError) throw pathError;
    }
  }

  return username;
}
