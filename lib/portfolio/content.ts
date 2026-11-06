import type { BuilderState, PortfolioData, VariantContentConfig } from "./types.ts";

export function fullContentConfig(data: PortfolioData): VariantContentConfig {
  return {
    experienceIds: data.experience.map((item) => item.id),
    projectIds: data.projects.map((item) => item.id),
    skills: [...data.skills],
  };
}

/**
 * Keeps the invariant that state.data is the open portfolio's own data.
 * Helpers that build a new state from scratch must go through this, or the
 * edit lands on the working copy but never on the portfolio that owns it.
 */
export function syncActiveData(state: BuilderState): BuilderState {
  return {
    ...state,
    variants: state.variants.map((variant) =>
      variant.id === state.activeVariantId
        ? { ...variant, data: state.data }
        : variant
    ),
  };
}

/** Deep copy so one portfolio's edits cannot reach another's content. */
export function cloneData(data: PortfolioData): PortfolioData {
  return {
    profile: { ...data.profile, socials: data.profile.socials.map((s) => ({ ...s })) },
    experience: data.experience.map((item) => ({ ...item })),
    projects: data.projects.map((item) => ({ ...item, stack: [...item.stack] })),
    skills: [...data.skills],
    customSections: data.customSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

export function cloneContentConfig(
  content: VariantContentConfig
): VariantContentConfig {
  return {
    experienceIds: [...content.experienceIds],
    projectIds: [...content.projectIds],
    skills: [...content.skills],
  };
}

/**
 * Experience and project ids are primary keys shared by every account in the
 * database, so a workspace that reuses fixed ids (the demo) collides as soon
 * as a second account saves it. Give each loaded copy its own ids, remapped
 * everywhere they are referenced.
 */
export function withFreshContentIds(
  state: BuilderState,
  suffix: string = crypto.randomUUID().slice(0, 8)
): BuilderState {
  const ids = new Map<string, string>();
  const fresh = (id: string) => {
    let next = ids.get(id);
    if (!next) {
      next = `${id}-${suffix}`;
      ids.set(id, next);
    }
    return next;
  };
  const remapData = (data: PortfolioData): PortfolioData => ({
    ...data,
    experience: data.experience.map((item) => ({ ...item, id: fresh(item.id) })),
    projects: data.projects.map((item) => ({ ...item, id: fresh(item.id) })),
  });

  return {
    ...state,
    data: remapData(state.data),
    variants: state.variants.map((variant) => ({
      ...variant,
      data: remapData(variant.data),
      content: {
        ...variant.content,
        experienceIds: variant.content.experienceIds.map(fresh),
        projectIds: variant.content.projectIds.map(fresh),
      },
    })),
  };
}
