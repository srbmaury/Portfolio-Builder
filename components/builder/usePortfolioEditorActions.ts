"use client";

import { useMemo } from "react";
import {
  addCustomSection as addCustomSectionToState,
  addCustomSectionItem as addCustomSectionItemToState,
  removeCustomSection as removeCustomSectionFromState,
  removeCustomSectionItem as removeCustomSectionItemFromState,
  updateCustomSectionItem as updateCustomSectionItemInState,
  updateCustomSectionTitle as updateCustomSectionTitleInState,
} from "@/lib/custom-sections";
import { trackProductEvent } from "@/lib/product-analytics";
import {
  cloneBranding,
  cloneConfig,
  cloneContentConfig,
  cloneResume,
  createEntityId,
  defaultConfig,
  fullContentConfig,
  sectionType,
  slugify,
  templateCatalog,
  type BuilderState,
  type Experience,
  type PortfolioConfig,
  type PortfolioData,
  type Project,
  type ThemeName,
} from "@/lib/portfolio";

type SetBuilderState = React.Dispatch<React.SetStateAction<BuilderState>>;
type TargetField = "experienceIds" | "projectIds" | "skills";

export function usePortfolioEditorActions({
  state,
  setState,
  setShareUrl,
}: {
  state: BuilderState;
  setState: SetBuilderState;
  setShareUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
  const activeVariant =
    state.variants.find((variant) => variant.id === state.activeVariantId) ??
    state.variants[0];

  const targetedExperience = useMemo(() => {
    if (!activeVariant) return state.data.experience;
    const selected = new Set(activeVariant.content.experienceIds);
    const byId = new Map(state.data.experience.map((item) => [item.id, item]));

    return [
      ...activeVariant.content.experienceIds
        .map((id) => byId.get(id))
        .filter((item): item is Experience => Boolean(item)),
      ...state.data.experience.filter((item) => !selected.has(item.id)),
    ];
  }, [activeVariant, state.data.experience]);

  const targetedProjects = useMemo(() => {
    if (!activeVariant) return state.data.projects;
    const selected = new Set(activeVariant.content.projectIds);
    const byId = new Map(state.data.projects.map((item) => [item.id, item]));

    return [
      ...activeVariant.content.projectIds
        .map((id) => byId.get(id))
        .filter((item): item is Project => Boolean(item)),
      ...state.data.projects.filter((item) => !selected.has(item.id)),
    ];
  }, [activeVariant, state.data.projects]);

  const targetedSkills = useMemo(() => {
    if (!activeVariant) return state.data.skills;
    const selected = new Set(activeVariant.content.skills);

    return [
      ...activeVariant.content.skills.filter((skill) =>
        state.data.skills.includes(skill)
      ),
      ...state.data.skills.filter((skill) => !selected.has(skill)),
    ];
  }, [activeVariant, state.data.skills]);

  function updateData(updater: (data: PortfolioData) => PortfolioData) {
    setState((current) => ({ ...current, data: updater(current.data) }));
  }

  function updateActiveConfig(
    updater: (config: PortfolioConfig) => PortfolioConfig
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, config: updater(variant.config) }
          : variant
      ),
    }));
  }

  function updateActiveContent(
    field: TargetField,
    updater: (items: string[]) => string[]
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? {
              ...variant,
              content: {
                ...variant.content,
                [field]: updater(variant.content[field]),
              },
            }
          : variant
      ),
    }));
  }

  function toggleTarget(field: TargetField, value: string) {
    updateActiveContent(field, (items) =>
      items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value]
    );
  }

  function moveTarget(
    field: TargetField,
    value: string,
    direction: -1 | 1
  ) {
    updateActiveContent(field, (items) => {
      const index = items.indexOf(value);
      if (index < 0) return items;

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= items.length) return items;

      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function selectAllTargets(field: TargetField) {
    const all =
      field === "experienceIds"
        ? state.data.experience.map((item) => item.id)
        : field === "projectIds"
          ? state.data.projects.map((item) => item.id)
          : state.data.skills;

    updateActiveContent(field, () => [...all]);
  }

  function clearTargets(field: TargetField) {
    updateActiveContent(field, () => []);
  }

  function updateProfile(
    field:
      | "name"
      | "role"
      | "tagline"
      | "about"
      | "email"
      | "location"
      | "availability"
      | "heroImageUrl",
    value: string
  ) {
    updateData((data) => ({
      ...data,
      profile: { ...data.profile, [field]: value },
    }));
  }

  function updateTheme(theme: ThemeName) {
    updateActiveConfig((config) => ({ ...config, theme }));
  }

  function updateBranding(
    field: "faviconUrl" | "shareTitle" | "shareDescription" | "shareImageUrl",
    value: string
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? {
              ...variant,
              branding: { ...variant.branding, [field]: value },
            }
          : variant
      ),
    }));
  }

  function updateResume(resume: {
    url: string;
    publicId: string;
    fileName: string;
  }) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, resume }
          : variant
      ),
    }));
    setShareUrl("");
  }

  function setVariant(configId: string, variantName: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === configId
          ? { ...section, variant: variantName }
          : section
      ),
    }));
  }

  function setSectionTitle(configId: string, title: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === configId ? { ...section, title } : section
      ),
    }));
  }

  function toggleSection(configId: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === configId
          ? { ...section, visible: !section.visible }
          : section
      ),
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    updateActiveConfig((config) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= config.sections.length) return config;

      const sections = [...config.sections];
      [sections[index], sections[nextIndex]] = [
        sections[nextIndex],
        sections[index],
      ];
      return { ...config, sections };
    });
  }

  function shuffleDesign() {
    const themes: ThemeName[] = [
      "ink",
      "sand",
      "moss",
      "aurora",
      "cobalt",
      "rose",
      "mono",
      "sunset",
      "ice",
      "noir",
    ];

    updateActiveConfig((config) => ({
      ...config,
      theme: themes[Math.floor(Math.random() * themes.length)],
      sections: config.sections.map((section) => {
        const options = templateCatalog[sectionType(section)];
        return {
          ...section,
          variant: options[Math.floor(Math.random() * options.length)].id,
        };
      }),
    }));
  }

  function updateExperience(
    index: number,
    field: "company" | "role" | "period" | "summary",
    value: string
  ) {
    updateData((data) => ({
      ...data,
      experience: data.experience.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addExperience(input: {
    company: string;
    role: string;
    period: string;
    summary: string;
  }) {
    const id = createEntityId("experience");

    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        experience: [...current.data.experience, { id, ...input }],
      },
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? {
              ...variant,
              content: {
                ...variant.content,
                experienceIds: [...variant.content.experienceIds, id],
              },
            }
          : variant
      ),
    }));
  }

  function removeExperience(index: number) {
    const id = state.data.experience[index]?.id;
    if (!id) return;

    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        experience: current.data.experience.filter((item) => item.id !== id),
      },
      variants: current.variants.map((variant) => ({
        ...variant,
        content: {
          ...variant.content,
          experienceIds: variant.content.experienceIds.filter(
            (experienceId) => experienceId !== id
          ),
        },
      })),
    }));
  }

  function updateProject(
    index: number,
    field: "title" | "description" | "imageUrl" | "githubUrl" | "liveUrl",
    value: string
  ) {
    updateData((data) => ({
      ...data,
      projects: data.projects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [field]: value } : project
      ),
    }));
  }

  function updateProjectStack(index: number, value: string) {
    const stack = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    updateData((data) => ({
      ...data,
      projects: data.projects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, stack } : project
      ),
    }));
  }

  function addProject(input: {
    title: string;
    description: string;
    stack: string[];
    imageUrl?: string;
    githubUrl?: string;
    liveUrl?: string;
  }) {
    const id = createEntityId("project");

    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        projects: [...current.data.projects, { id, ...input }],
      },
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? {
              ...variant,
              content: {
                ...variant.content,
                projectIds: [...variant.content.projectIds, id],
              },
            }
          : variant
      ),
    }));
  }

  function removeProject(index: number) {
    const id = state.data.projects[index]?.id;
    if (!id) return;

    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        projects: current.data.projects.filter((item) => item.id !== id),
      },
      variants: current.variants.map((variant) => ({
        ...variant,
        content: {
          ...variant.content,
          projectIds: variant.content.projectIds.filter(
            (projectId) => projectId !== id
          ),
        },
      })),
    }));
  }

  function updateSkills(value: string) {
    const skills = Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    setState((current) => {
      const previous = new Set(current.data.skills);
      const next = new Set(skills);
      const added = skills.filter((skill) => !previous.has(skill));

      return {
        ...current,
        data: { ...current.data, skills },
        variants: current.variants.map((variant) => ({
          ...variant,
          content: {
            ...variant.content,
            skills: [
              ...variant.content.skills.filter((skill) => next.has(skill)),
              ...(variant.id === current.activeVariantId ? added : []),
            ],
          },
        })),
      };
    });
  }

  function updateSocial(
    index: number,
    field: "label" | "url",
    value: string
  ) {
    updateData((data) => ({
      ...data,
      profile: {
        ...data.profile,
        socials: data.profile.socials.map((social, socialIndex) =>
          socialIndex === index ? { ...social, [field]: value } : social
        ),
      },
    }));
  }

  function addSocial(input: { label: string; url: string }) {
    updateData((data) => ({
      ...data,
      profile: {
        ...data.profile,
        socials: [...data.profile.socials, input],
      },
    }));
  }

  function removeSocial(index: number) {
    updateData((data) => ({
      ...data,
      profile: {
        ...data.profile,
        socials: data.profile.socials.filter(
          (_, socialIndex) => socialIndex !== index
        ),
      },
    }));
  }

  function createCustomSection(title: string) {
    setState((current) => addCustomSectionToState(current, title));
    setShareUrl("");
  }

  function renameCustomSection(customSectionId: string, title: string) {
    setState((current) =>
      updateCustomSectionTitleInState(current, customSectionId, title)
    );
  }

  function addCustomItem(customSectionId: string) {
    setState((current) =>
      addCustomSectionItemToState(current, customSectionId)
    );
  }

  function updateCustomItem(
    customSectionId: string,
    itemId: string,
    field:
      | "heading"
      | "subheading"
      | "meta"
      | "description"
      | "linkLabel"
      | "linkUrl",
    value: string
  ) {
    setState((current) =>
      updateCustomSectionItemInState(
        current,
        customSectionId,
        itemId,
        field,
        value
      )
    );
  }

  function removeCustomItem(customSectionId: string, itemId: string) {
    setState((current) =>
      removeCustomSectionItemFromState(current, customSectionId, itemId)
    );
  }

  function removeCustomSection(customSectionId: string) {
    if (
      !window.confirm(
        "Delete this custom section from every portfolio variant?"
      )
    ) {
      return;
    }

    setState((current) =>
      removeCustomSectionFromState(current, customSectionId)
    );
    setShareUrl("");
  }

  function createVariant(input: { name: string; targetRole: string }) {
    const currentConfig = activeVariant?.config ?? defaultConfig;
    const number = state.variants.length + 1;
    const id = `portfolio-${number}-${Date.now().toString(36)}`;

    setState((current) => ({
      ...current,
      activeVariantId: id,
      variants: [
        ...current.variants,
        {
          id,
          name: input.name,
          targetRole: input.targetRole,
          config: cloneConfig(currentConfig),
          content: cloneContentConfig(
            activeVariant?.content ?? fullContentConfig(current.data)
          ),
          branding: cloneBranding(activeVariant?.branding),
          resume: cloneResume(activeVariant?.resume),
        },
      ],
    }));

    trackProductEvent("portfolio_created", id);
    setShareUrl("");
  }

  function duplicateVariant() {
    if (!activeVariant) return;

    const id = `${slugify(activeVariant.name)}-copy-${Date.now().toString(36)}`;

    setState((current) => ({
      ...current,
      activeVariantId: id,
      variants: [
        ...current.variants,
        {
          id,
          name: `${activeVariant.name} Copy`,
          targetRole: activeVariant.targetRole,
          config: cloneConfig(activeVariant.config),
          content: cloneContentConfig(activeVariant.content),
          branding: cloneBranding(activeVariant.branding),
          resume: cloneResume(activeVariant.resume),
        },
      ],
    }));

    trackProductEvent("portfolio_created", id);
    setShareUrl("");
  }

  function updateVariantMeta(
    field: "name" | "targetRole",
    value: string
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, [field]: value }
          : variant
      ),
    }));
  }

  return {
    activeVariant,
    targetedExperience,
    targetedProjects,
    targetedSkills,
    toggleTarget,
    moveTarget,
    selectAllTargets,
    clearTargets,
    updateProfile,
    updateTheme,
    updateBranding,
    updateResume,
    setVariant,
    setSectionTitle,
    toggleSection,
    moveSection,
    shuffleDesign,
    updateExperience,
    addExperience,
    removeExperience,
    updateProject,
    updateProjectStack,
    addProject,
    removeProject,
    updateSkills,
    updateSocial,
    addSocial,
    removeSocial,
    createCustomSection,
    renameCustomSection,
    addCustomItem,
    updateCustomItem,
    removeCustomItem,
    removeCustomSection,
    createVariant,
    duplicateVariant,
    updateVariantMeta,
  };
}
