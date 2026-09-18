import type { VariantContentConfig } from "./portfolio.ts";

export function selectOrphanedTargetContent(
  target: VariantContentConfig,
  remaining: VariantContentConfig[]
): VariantContentConfig {
  const usedExperience = new Set(
    remaining.flatMap((content) => content.experienceIds || [])
  );
  const usedProjects = new Set(
    remaining.flatMap((content) => content.projectIds || [])
  );
  const usedSkills = new Set(
    remaining.flatMap((content) => content.skills || [])
  );

  return {
    experienceIds: Array.from(
      new Set((target.experienceIds || []).filter((id) => !usedExperience.has(id)))
    ),
    projectIds: Array.from(
      new Set((target.projectIds || []).filter((id) => !usedProjects.has(id)))
    ),
    skills: Array.from(
      new Set((target.skills || []).filter((skill) => !usedSkills.has(skill)))
    ),
  };
}
