import {
  createEntityId,
  normalizeBuilderState,
  type BuilderState,
  type Experience,
  type Project,
} from "./portfolio.ts";
import type { ResumeImportDraft } from "./resume-parser.ts";

export function mergeResumeImport(
  input: BuilderState,
  draft: ResumeImportDraft
): BuilderState {
  const state = normalizeBuilderState(input);
  const profile = { ...state.data.profile };

  for (const key of [
    "name",
    "role",
    "tagline",
    "about",
    "email",
    "location",
  ] as const) {
    const value = draft.profile[key]?.trim();
    if (value) profile[key] = value;
  }

  const socials = [...profile.socials];
  const socialKeys = new Set(
    socials.flatMap((social) => [
      `url:${normalize(social.url)}`,
      `label:${normalize(social.label)}`,
    ])
  );
  for (const social of draft.profile.socials || []) {
    const label = social.label.trim();
    const url = social.url.trim();
    if (!label || !url) continue;
    if (
      socialKeys.has(`url:${normalize(url)}`) ||
      socialKeys.has(`label:${normalize(label)}`)
    ) {
      continue;
    }
    socials.push({ label, url });
    socialKeys.add(`url:${normalize(url)}`);
    socialKeys.add(`label:${normalize(label)}`);
  }
  profile.socials = socials;

  const experience = [...state.data.experience];
  const experienceKeys = new Set(experience.map(experienceKey));
  const newExperienceIds: string[] = [];

  for (const imported of draft.experience || []) {
    const clean = cleanExperience(imported);
    const key = experienceKey(clean);
    if (!clean.company && !clean.role) continue;
    if (experienceKeys.has(key)) continue;

    const item = { ...clean, id: createEntityId("experience") };
    experience.push(item);
    experienceKeys.add(key);
    newExperienceIds.push(item.id);
  }

  const projects = [...state.data.projects];
  const projectKeys = new Set(projects.map(projectKey));
  const newProjectIds: string[] = [];

  for (const imported of draft.projects || []) {
    const clean = cleanProject(imported);
    const key = projectKey(clean);
    if (!clean.title || projectKeys.has(key)) continue;

    const item = { ...clean, id: createEntityId("project") };
    projects.push(item);
    projectKeys.add(key);
    newProjectIds.push(item.id);
  }

  const skills = [...state.data.skills];
  const skillByKey = new Map(skills.map((skill) => [normalize(skill), skill]));
  const newSkills: string[] = [];

  for (const rawSkill of draft.skills || []) {
    const skill = rawSkill.trim();
    if (!skill) continue;
    const key = normalize(skill);
    if (skillByKey.has(key)) continue;
    skillByKey.set(key, skill);
    skills.push(skill);
    newSkills.push(skill);
  }

  return normalizeBuilderState({
    ...state,
    data: {
      ...state.data,
      profile,
      experience,
      projects,
      skills,
    },
    variants: state.variants.map((variant) =>
      variant.id === state.activeVariantId
        ? {
            ...variant,
            content: {
              ...variant.content,
              experienceIds: unique([
                ...variant.content.experienceIds,
                ...newExperienceIds,
              ]),
              projectIds: unique([
                ...variant.content.projectIds,
                ...newProjectIds,
              ]),
              skills: unique([...variant.content.skills, ...newSkills]),
            },
          }
        : variant
    ),
  });
}

function cleanExperience(item: Experience): Experience {
  return {
    id: item.id || "",
    company: item.company?.trim() || "",
    role: item.role?.trim() || "",
    period: item.period?.trim() || "",
    summary: item.summary?.trim() || "",
  };
}

function cleanProject(item: Project): Project {
  return {
    id: item.id || "",
    title: item.title?.trim() || "",
    description: item.description?.trim() || "",
    stack: Array.isArray(item.stack)
      ? item.stack.map((value) => value.trim()).filter(Boolean)
      : [],
    imageUrl: item.imageUrl?.trim() || undefined,
    githubUrl: item.githubUrl?.trim() || undefined,
    liveUrl: item.liveUrl?.trim() || undefined,
  };
}

function experienceKey(item: Experience) {
  return [item.company, item.role, item.period].map(normalize).join("|");
}

function projectKey(item: Project) {
  return normalize(item.title);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
