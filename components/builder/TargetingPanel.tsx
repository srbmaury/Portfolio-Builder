import { TargetingSection, TargetRow } from "./TargetingControls";
import type { BuilderState } from "@/lib/portfolio";
import type { usePortfolioEditorActions } from "./usePortfolioEditorActions";

type Props = {
  state: Pick<BuilderState, "data">;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "activeVariant"
    | "targetedExperience"
    | "targetedProjects"
    | "targetedSkills"
    | "toggleTarget"
    | "moveTarget"
    | "selectAllTargets"
    | "clearTargets"
  >;
};

export function TargetingPanel({
  state,
  actions,
}: Props) {
  const {
    activeVariant,
    targetedExperience,
    targetedProjects,
    targetedSkills,
    toggleTarget,
    moveTarget,
    selectAllTargets,
    clearTargets,
  } = actions;

  return (
    <div className="panel-body">
      <div className="panel-intro">
        <h2>What to show</h2>
        <p>
          Tick what {activeVariant?.name || "this portfolio"} shows and use the
          arrows to set the order.
        </p>
      </div>

      <TargetingSection
        title="Experience"
        selectedCount={activeVariant?.content.experienceIds.length || 0}
        totalCount={state.data.experience.length}
        onSelectAll={() => selectAllTargets("experienceIds")}
        onClear={() => clearTargets("experienceIds")}
      >
        {targetedExperience.map((item) => {
          const selected =
            activeVariant?.content.experienceIds.includes(item.id) || false;
          const selectedIndex =
            activeVariant?.content.experienceIds.indexOf(item.id) ?? -1;
          return (
            <TargetRow
              key={item.id}
              label={item.role}
              detail={item.company}
              selected={selected}
              onToggle={() => toggleTarget("experienceIds", item.id)}
              onMoveUp={() => moveTarget("experienceIds", item.id, -1)}
              onMoveDown={() => moveTarget("experienceIds", item.id, 1)}
              canMoveUp={selected && selectedIndex > 0}
              canMoveDown={
                selected &&
                selectedIndex <
                  (activeVariant?.content.experienceIds.length || 0) - 1
              }
            />
          );
        })}
      </TargetingSection>

      <TargetingSection
        title="Projects"
        selectedCount={activeVariant?.content.projectIds.length || 0}
        totalCount={state.data.projects.length}
        onSelectAll={() => selectAllTargets("projectIds")}
        onClear={() => clearTargets("projectIds")}
      >
        {targetedProjects.map((project) => {
          const selected =
            activeVariant?.content.projectIds.includes(project.id) || false;
          const selectedIndex =
            activeVariant?.content.projectIds.indexOf(project.id) ?? -1;
          return (
            <TargetRow
              key={project.id}
              label={project.title}
              detail={project.stack.join(" · ")}
              selected={selected}
              onToggle={() => toggleTarget("projectIds", project.id)}
              onMoveUp={() => moveTarget("projectIds", project.id, -1)}
              onMoveDown={() => moveTarget("projectIds", project.id, 1)}
              canMoveUp={selected && selectedIndex > 0}
              canMoveDown={
                selected &&
                selectedIndex <
                  (activeVariant?.content.projectIds.length || 0) - 1
              }
            />
          );
        })}
      </TargetingSection>

      <TargetingSection
        title="Skills"
        selectedCount={activeVariant?.content.skills.length || 0}
        totalCount={state.data.skills.length}
        onSelectAll={() => selectAllTargets("skills")}
        onClear={() => clearTargets("skills")}
      >
        {targetedSkills.map((skill) => {
          const selected =
            activeVariant?.content.skills.includes(skill) || false;
          const selectedIndex =
            activeVariant?.content.skills.indexOf(skill) ?? -1;
          return (
            <TargetRow
              key={skill}
              label={skill}
              selected={selected}
              onToggle={() => toggleTarget("skills", skill)}
              onMoveUp={() => moveTarget("skills", skill, -1)}
              onMoveDown={() => moveTarget("skills", skill, 1)}
              canMoveUp={selected && selectedIndex > 0}
              canMoveDown={
                selected &&
                selectedIndex <
                  (activeVariant?.content.skills.length || 0) - 1
              }
            />
          );
        })}
      </TargetingSection>
    </div>
  );
}
