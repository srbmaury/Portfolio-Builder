import { useMemo } from "react";
import type { BuilderState, Experience, PortfolioVariant, Project } from "@/lib/portfolio";
import type { SetBuilderState } from "../types";

type TargetField = "experienceIds" | "projectIds" | "skills";

export function useTargetingActions(
  state: BuilderState,
  activeVariant: PortfolioVariant | undefined,
  setState: SetBuilderState
) {
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

  return {
    targetedExperience,
    targetedProjects,
    targetedSkills,
    toggleTarget,
    moveTarget,
    selectAllTargets,
    clearTargets,
  };
}
