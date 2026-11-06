import {
  addCustomSection as addCustomSectionToState,
  addCustomSectionItem as addCustomSectionItemToState,
  removeCustomSection as removeCustomSectionFromState,
  removeCustomSectionItem as removeCustomSectionItemFromState,
  updateCustomSectionItem as updateCustomSectionItemInState,
  updateCustomSectionTitle as updateCustomSectionTitleInState,
} from "@/lib/custom-sections";
import { createEntityId } from "@/lib/portfolio";
import type { BuilderState, PortfolioData, PortfolioResume } from "@/lib/portfolio";
import type { SetBuilderState } from "../types";

export function createContentActions(
  state: BuilderState,
  setState: SetBuilderState,
  setShareUrl: (url: string) => void
) {
  function updateData(updater: (data: PortfolioData) => PortfolioData) {
    setState((current) => ({ ...current, data: updater(current.data) }));
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

  function updateResume(resume: PortfolioResume) {
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

  return {
    updateProfile,
    updateResume,
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
  };
}
