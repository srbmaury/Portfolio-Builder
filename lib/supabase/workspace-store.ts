import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cloneConfig, normalizeBuilderState, publicUsernameForProfile } from "@/lib/portfolio";
import type { BuilderState, PortfolioData, PortfolioVariant } from "@/lib/portfolio";
import { slugForVariant } from "./portfolio-slug";

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
    // Rows saved before content became per-portfolio have no data_config, so
    // they fall back to the old shared tables. normalizeBuilderState then gives
    // each portfolio its own copy, leaving published output unchanged.
    data:
      row.data_config && typeof row.data_config === "object"
        ? (row.data_config as PortfolioData)
        : data,
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
            showInHero: false,
            hideSectionWhenHeroLink: false,
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

  const payload = {
    username,
    profile: {
      ...state.data.profile,
      email: state.data.profile.email || user.email || "",
    },
    customSections: state.data.customSections,
    experience: state.data.experience,
    projects: state.data.projects,
    skills: state.data.skills,
    variants: state.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      slug: slugForVariant(state.variants, variant),
      targetRole: variant.targetRole,
      theme: variant.config.theme,
      sections: cloneConfig(variant.config).sections,
      content: variant.content,
      // Each portfolio carries its own content now.
      data: variant.data,
      branding: variant.branding,
      resume: variant.resume,
    })),
  };

  const { data, error } = await supabase.rpc("save_portfolio_workspace", {
    payload,
  });

  if (error) throw error;

  return {
    username: typeof data === "string" && data ? data : username,
  };
}
