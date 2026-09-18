import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  cloneConfig,
  normalizeBuilderState,
  publicUsernameForProfile,
  slugify,
  snapshotForVariant,
  type BuilderState,
  type PortfolioVariant,
} from "@/lib/portfolio";

export type PortfolioSummary = {
  variantKey: string;
  name: string;
  targetRole: string;
  theme: string;
  isPublished: boolean;
  publishedAt: string | null;
  publicPath: string | null;
  createdAt: string;
};

type ProfileRow = {
  username: string;
  full_name: string;
  role: string;
  tagline: string;
  about: string;
  email: string;
  location: string;
  availability: string;
  hero_image_url: string;
  social_links: Array<{ label: string; url: string }>;
  custom_sections: BuilderState["data"]["customSections"];
};

export async function loadBuilderState(
  supabase: SupabaseClient,
  user: User
): Promise<BuilderState | null> {
  const [
    profileResult,
    experienceResult,
    projectResult,
    skillResult,
    portfolioResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("experiences")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order"),
    supabase.from("projects").select("*").eq("user_id", user.id).order("sort_order"),
    supabase.from("skills").select("*").eq("user_id", user.id).order("sort_order"),
    supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at"),
  ]);

  const firstError = [
    profileResult.error,
    experienceResult.error,
    projectResult.error,
    skillResult.error,
    portfolioResult.error,
  ].find(Boolean);
  if (firstError) throw firstError;

  if (!profileResult.data) return null;

  const profile = profileResult.data as ProfileRow;
  const data = {
    profile: {
      name: profile.full_name,
      role: profile.role,
      tagline: profile.tagline,
      about: profile.about,
      email: profile.email,
      location: profile.location,
      availability: profile.availability,
      heroImageUrl: profile.hero_image_url || "",
      socials: Array.isArray(profile.social_links) ? profile.social_links : [],
    },
    experience: (experienceResult.data || []).map((row) => ({
      id: row.id,
      company: row.company,
      role: row.role,
      period: row.period,
      summary: row.summary,
    })),
    projects: (projectResult.data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      stack: row.stack || [],
      imageUrl: row.image_url || undefined,
      githubUrl: row.github_url || undefined,
      liveUrl: row.live_url || undefined,
    })),
    skills: (skillResult.data || []).map((row) => row.name),
    customSections: Array.isArray(profile.custom_sections)
      ? profile.custom_sections
      : [],
  };

  const variants: PortfolioVariant[] = (portfolioResult.data || []).map((row) => ({
    id: row.variant_key,
    name: row.name,
    targetRole: row.target_role,
    config: {
      theme: row.theme,
      sections: Array.isArray(row.section_config) ? row.section_config : [],
    },
    content:
      row.content_config && typeof row.content_config === "object"
        ? row.content_config
        : { experienceIds: [], projectIds: [], skills: [] },
    branding:
      row.branding_config && typeof row.branding_config === "object"
        ? row.branding_config
        : {
            faviconUrl: "",
            shareTitle: "",
            shareDescription: "",
            shareImageUrl: "",
          },
    resume:
      row.resume_config && typeof row.resume_config === "object"
        ? row.resume_config
        : {
            url: "",
            publicId: "",
            fileName: "",
          },
  }));

  if (!variants.length) return null;

  return normalizeBuilderState({
    data,
    variants,
    activeVariantId: variants[0].id,
  } as BuilderState);
}

export async function saveBuilderState(
  supabase: SupabaseClient,
  user: User,
  input: BuilderState
) {
  const state = normalizeBuilderState(input);
  const username = await ensureProfile(supabase, user, state);

  const { error: expDelete } = await supabase
    .from("experiences")
    .delete()
    .eq("user_id", user.id);
  if (expDelete) throw expDelete;

  if (state.data.experience.length) {
    const { error } = await supabase.from("experiences").insert(
      state.data.experience.map((item, index) => ({
        id: item.id,
        user_id: user.id,
        company: item.company,
        role: item.role,
        period: item.period,
        summary: item.summary,
        sort_order: index,
      }))
    );
    if (error) throw error;
  }

  const { error: projectDelete } = await supabase
    .from("projects")
    .delete()
    .eq("user_id", user.id);
  if (projectDelete) throw projectDelete;

  if (state.data.projects.length) {
    const { error } = await supabase.from("projects").insert(
      state.data.projects.map((project, index) => ({
        id: project.id,
        user_id: user.id,
        title: project.title,
        description: project.description,
        stack: project.stack,
        image_url: project.imageUrl || null,
        github_url: project.githubUrl || null,
        live_url: project.liveUrl || null,
        sort_order: index,
      }))
    );
    if (error) throw error;
  }

  const { error: skillDelete } = await supabase
    .from("skills")
    .delete()
    .eq("user_id", user.id);
  if (skillDelete) throw skillDelete;

  if (state.data.skills.length) {
    const { error } = await supabase.from("skills").insert(
      state.data.skills.map((name, index) => ({
        user_id: user.id,
        name,
        sort_order: index,
      }))
    );
    if (error) throw error;
  }

  const { data: existingPortfolios, error: existingPortfolioError } = await supabase
    .from("portfolios")
    .select("variant_key, slug")
    .eq("user_id", user.id);
  if (existingPortfolioError) throw existingPortfolioError;

  const existingByKey = new Map(
    (existingPortfolios || []).map((row) => [row.variant_key, row])
  );

  const { error: portfolioUpsert } = await supabase.from("portfolios").upsert(
    state.variants.map((variant) => ({
      user_id: user.id,
      variant_key: variant.id,
      name: variant.name,
      slug:
        existingByKey.get(variant.id)?.slug ||
        slugForVariant(state.variants, variant),
      target_role: variant.targetRole,
      theme: variant.config.theme,
      section_config: variant.config.sections,
      content_config: variant.content,
      branding_config: variant.branding,
      resume_config: variant.resume,
    })),
    { onConflict: "user_id,variant_key" }
  );
  if (portfolioUpsert) throw portfolioUpsert;

  return { username };
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

  const { error } = await supabase.from("portfolios").upsert(
    {
      user_id: user.id,
      variant_key: active.id,
      name: active.name,
      slug,
      target_role: active.targetRole,
      theme: active.config.theme,
      section_config: cloneConfig(active.config).sections,
      content_config: active.content,
      branding_config: active.branding,
      resume_config: active.resume,
      is_published: true,
      published_at: new Date().toISOString(),
      public_path: publicPath,
      published_snapshot: snapshot,
    },
    { onConflict: "user_id,variant_key" }
  );

  if (error) throw error;
  return publicPath;
}


export async function listPortfolios(
  supabase: SupabaseClient,
  user: User
): Promise<PortfolioSummary[]> {
  const { data, error } = await supabase
    .from("portfolios")
    .select(
      "variant_key, name, target_role, theme, is_published, published_at, public_path, created_at"
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
  supabase: SupabaseClient,
  user: User,
  variantKey: string
) {
  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("user_id", user.id)
    .eq("variant_key", variantKey);

  if (error) throw error;
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


function slugForVariant(
  variants: PortfolioVariant[],
  variant: PortfolioVariant
) {
  const base = basePortfolioSlug(variant.name);
  const index = Math.max(
    0,
    variants.findIndex((candidate) => candidate.id === variant.id)
  );

  const duplicateNumber =
    variants
      .slice(0, index)
      .filter((candidate) => basePortfolioSlug(candidate.name) === base).length + 1;

  if (duplicateNumber === 1) return base;

  const suffix = `-${duplicateNumber}`;
  return `${base.slice(0, 40 - suffix.length)}${suffix}`;
}

function basePortfolioSlug(name: string) {
  const raw = slugify(name);
  const safe = raw.length >= 2 ? raw : `portfolio-${raw}`;
  return safe.slice(0, 40).replace(/-+$/g, "") || "portfolio";
}
