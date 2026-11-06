import {
  splitProjectDescription,
  joinProjectDescription,
  formatExperienceBullets,
} from "@/lib/portfolio-prose";
import type { PortfolioData } from "@/lib/portfolio";
import { EditorCard, EditorSection, Field } from "../EditorFields";
import { ImageUploadField } from "../UploadFields";
import type { CreateDialogKind } from "../types";
import type { usePortfolioEditorActions } from "../usePortfolioEditorActions";

export function WorkEditor({
  data,
  visibleData,
  setCreateDialog,
  actions,
}: {
  data: Pick<PortfolioData, "experience" | "projects" | "skills">;
  visibleData: Pick<PortfolioData, "experience" | "projects" | "skills">;
  setCreateDialog: (kind: CreateDialogKind) => void;
  actions: Pick<
    ReturnType<typeof usePortfolioEditorActions>,
    | "updateExperience"
    | "removeExperience"
    | "updateProject"
    | "updateProjectStack"
    | "removeProject"
    | "updateSkills"
  >;
}) {
  const {
    updateExperience,
    removeExperience,
    updateProject,
    updateProjectStack,
    removeProject,
    updateSkills,
  } = actions;

  return (
    <>
      <EditorSection
        title="Experience"
        subtitle={`${visibleData.experience.length} of ${data.experience.length} roles in this portfolio`}
        actionLabel="+ Add"
        onAction={() => setCreateDialog("experience")}
      >
        {data.experience.map((item, index) => (
          <EditorCard
            key={`experience-${index}`}
            title={item.role || `Role ${index + 1}`}
            onDelete={() => removeExperience(index)}
          >
            <Field
              label="Company"
              value={item.company}
              onChange={(value) => updateExperience(index, "company", value)}
            />
            <Field
              label="Role"
              value={item.role}
              onChange={(value) => updateExperience(index, "role", value)}
            />
            <Field
              label="Period"
              value={item.period}
              onChange={(value) => updateExperience(index, "period", value)}
            />
            <Field
              label="Summary / achievements"
              hint="Write a paragraph, or put one achievement per line and choose Format as bullets. You can also start bullet lines with -."
              multiline
              value={item.summary}
              onChange={(value) => updateExperience(index, "summary", value)}
            />
            <button
              type="button"
              disabled={!item.summary.trim()}
              onClick={() => updateExperience(index, "summary", formatExperienceBullets(item.summary))}
            >Format as bullets</button>
          </EditorCard>
        ))}
      </EditorSection>

      <EditorSection
        title="Projects"
        subtitle={`${visibleData.projects.length} of ${data.projects.length} projects in this portfolio`}
        actionLabel="+ Add"
        onAction={() => setCreateDialog("project")}
      >
        {data.projects.map((project, index) => (
          <EditorCard
            key={`project-${index}`}
            title={project.title || `Project ${index + 1}`}
            onDelete={() => removeProject(index)}
          >
            <Field
              label="Title"
              value={project.title}
              onChange={(value) => updateProject(index, "title", value)}
            />
            <Field
              label="Project overview"
              hint="Explain the problem and what you built in one or two sentences."
              multiline
              value={splitProjectDescription(project.description).overview}
              onChange={(value) => updateProject(index, "description", joinProjectDescription(value, splitProjectDescription(project.description).details))}
            />
            <Field
              label="Case study"
              hint="Optional. Use # headings for Problem, Approach, and Outcome; start achievement lines with -. Readers can expand this from the project card."
              multiline
              value={splitProjectDescription(project.description).details}
              onChange={(value) => updateProject(index, "description", joinProjectDescription(splitProjectDescription(project.description).overview, value))}
            />
            <Field
              label="Stack"
              value={project.stack.join(", ")}
              onChange={(value) => updateProjectStack(index, value)}
              hint="Comma separated"
            />
            <ImageUploadField
              label="Project image"
              value={project.imageUrl || ""}
              onChange={(value) => updateProject(index, "imageUrl", value)}
              help="Upload a screenshot or visual for image-based project layouts."
            />
            <Field
              label="GitHub URL"
              value={project.githubUrl || ""}
              onChange={(value) => updateProject(index, "githubUrl", value)}
            />
            <Field
              label="Live URL"
              value={project.liveUrl || ""}
              onChange={(value) => updateProject(index, "liveUrl", value)}
            />
          </EditorCard>
        ))}
      </EditorSection>

      <EditorSection
        title="Skills"
        subtitle={`${visibleData.skills.length} of ${data.skills.length} skills in this portfolio`}
      >
        <Field
          label="Skills"
          multiline
          value={data.skills.join(", ")}
          onChange={updateSkills}
          hint="Comma separated"
        />
      </EditorSection>
    </>
  );
}
