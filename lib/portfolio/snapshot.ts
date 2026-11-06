import { normalizeBuilderState } from "./normalize.ts";
import type { Experience, Project, BuilderState, PortfolioSnapshot } from "./types.ts";
import { cloneResume, cloneBranding, defaultConfig, sectionType, cloneConfig } from "./layout.ts";

export function snapshotForVariant(state: BuilderState): PortfolioSnapshot {
  const normalized = normalizeBuilderState(state);
  const active =
    normalized.variants.find(
      (variant) => variant.id === normalized.activeVariantId
    ) ?? normalized.variants[0];

  if (!active) {
    return {
      data: normalized.data,
      config: cloneConfig(defaultConfig),
      meta: {
        name: "Portfolio",
        targetRole: normalized.data.profile.role,
        branding: cloneBranding(),
        resume: cloneResume(),
      },
    };
  }

  // The portfolio publishes its own content, not a shared pool.
  const activeData = active.data;
  const experienceById = new Map(
    activeData.experience.map((item) => [item.id, item])
  );
  const projectById = new Map(activeData.projects.map((item) => [item.id, item]));
  const validSkills = new Set(activeData.skills);
  const customIds = new Set(
    active.config.sections
      .filter((section) => sectionType(section) === "custom")
      .map((section) => section.customSectionId)
      .filter((id): id is string => Boolean(id))
  );

  return {
    data: {
      ...activeData,
      profile: {
        ...activeData.profile,
        role: active.targetRole || activeData.profile.role,
      },
      experience: active.content.experienceIds
        .map((id) => experienceById.get(id))
        .filter((item): item is Experience => Boolean(item)),
      projects: active.content.projectIds
        .map((id) => projectById.get(id))
        .filter((item): item is Project => Boolean(item)),
      skills: active.content.skills.filter((skill) => validSkills.has(skill)),
      customSections: activeData.customSections.filter((section) =>
        customIds.has(section.id)
      ),
    },
    config: cloneConfig(active.config),
    meta: {
      name: active.name,
      targetRole: active.targetRole,
      branding: cloneBranding(active.branding),
      resume: cloneResume(active.resume),
    },
  };
}
