import type { Dispatch, SetStateAction } from "react";
import type { ResumeImportDraft } from "@/lib/resume-parser";

export type ResumeImportSelection = {
  profile: boolean;
  experience: boolean;
  projects: boolean;
  skills: boolean;
};

export function ResumeImportReview({
  draft,
  setDraft,
  include,
  setInclude,
}: {
  draft: ResumeImportDraft;
  setDraft: Dispatch<SetStateAction<ResumeImportDraft | null>>;
  include: ResumeImportSelection;
  setInclude: Dispatch<SetStateAction<ResumeImportSelection>>;
}) {
  function updateProfile(
    field: "name" | "role" | "tagline" | "about" | "email" | "location",
    value: string
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            profile: { ...current.profile, [field]: value },
          }
        : current
    );
  }

  function updateSocial(
    index: number,
    field: "label" | "url",
    value: string
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            profile: {
              ...current.profile,
              socials: current.profile.socials.map((social, socialIndex) =>
                socialIndex === index
                  ? { ...social, [field]: value }
                  : social
              ),
            },
          }
        : current
    );
  }

  function updateExperience(
    index: number,
    field: "company" | "role" | "period" | "summary",
    value: string
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            experience: current.experience.map((item, itemIndex) =>
              itemIndex === index ? { ...item, [field]: value } : item
            ),
          }
        : current
    );
  }

  function updateProject(
    index: number,
    field:
      | "title"
      | "description"
      | "githubUrl"
      | "liveUrl",
    value: string
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            projects: current.projects.map((item, itemIndex) =>
              itemIndex === index ? { ...item, [field]: value } : item
            ),
          }
        : current
    );
  }

  function updateProjectStack(index: number, value: string) {
    const stack = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setDraft((current) =>
      current
        ? {
            ...current,
            projects: current.projects.map((item, itemIndex) =>
              itemIndex === index ? { ...item, stack } : item
            ),
          }
        : current
    );
  }

  function updateSkills(value: string) {
    const skills = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    setDraft((current) => (current ? { ...current, skills } : current));
  }

  return (
    <div className="resume-review">
      <ReviewSection
        title="Profile"
        included={include.profile}
        onToggle={() =>
          setInclude((current) => ({
            ...current,
            profile: !current.profile,
          }))
        }
      >
        <div className="resume-field-grid">
          <ReviewField
            label="Name"
            value={draft.profile.name || ""}
            onChange={(value) => updateProfile("name", value)}
          />
          <ReviewField
            label="Role"
            value={draft.profile.role || ""}
            onChange={(value) => updateProfile("role", value)}
          />
          <ReviewField
            label="Email"
            value={draft.profile.email || ""}
            onChange={(value) => updateProfile("email", value)}
          />
          <ReviewField
            label="Location"
            value={draft.profile.location || ""}
            onChange={(value) => updateProfile("location", value)}
          />
        </div>
        <ReviewField
          label="Tagline"
          value={draft.profile.tagline || ""}
          onChange={(value) => updateProfile("tagline", value)}
          multiline
        />
        <ReviewField
          label="About"
          value={draft.profile.about || ""}
          onChange={(value) => updateProfile("about", value)}
          multiline
        />

        {draft.profile.socials.length ? (
          <div className="resume-review-list">
            {draft.profile.socials.map((social, index) => (
              <div className="resume-review-card" key={`${social.url}-${index}`}>
                <div className="resume-field-grid">
                  <ReviewField
                    label="Link label"
                    value={social.label}
                    onChange={(value) => updateSocial(index, "label", value)}
                  />
                  <ReviewField
                    label="URL"
                    value={social.url}
                    onChange={(value) => updateSocial(index, "url", value)}
                  />
                </div>
                <button
                  type="button"
                  className="danger-link"
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            profile: {
                              ...current.profile,
                              socials: current.profile.socials.filter(
                                (_, socialIndex) => socialIndex !== index
                              ),
                            },
                          }
                        : current
                    )
                  }
                >
                  Remove link
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </ReviewSection>

      <ReviewSection
        title={`Experience · ${draft.experience.length}`}
        included={include.experience}
        onToggle={() =>
          setInclude((current) => ({
            ...current,
            experience: !current.experience,
          }))
        }
      >
        <div className="resume-review-list">
          {draft.experience.map((item, index) => (
            <div className="resume-review-card" key={item.id}>
              <div className="resume-field-grid">
                <ReviewField
                  label="Company"
                  value={item.company}
                  onChange={(value) =>
                    updateExperience(index, "company", value)
                  }
                />
                <ReviewField
                  label="Role"
                  value={item.role}
                  onChange={(value) =>
                    updateExperience(index, "role", value)
                  }
                />
                <ReviewField
                  label="Period"
                  value={item.period}
                  onChange={(value) =>
                    updateExperience(index, "period", value)
                  }
                />
              </div>
              <ReviewField
                label="Summary"
                value={item.summary}
                onChange={(value) =>
                  updateExperience(index, "summary", value)
                }
                multiline
              />
              <button
                type="button"
                className="danger-link"
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          experience: current.experience.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        }
                      : current
                  )
                }
              >
                Remove experience
              </button>
            </div>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection
        title={`Projects · ${draft.projects.length}`}
        included={include.projects}
        onToggle={() =>
          setInclude((current) => ({
            ...current,
            projects: !current.projects,
          }))
        }
      >
        <div className="resume-review-list">
          {draft.projects.map((project, index) => (
            <div className="resume-review-card" key={project.id}>
              <ReviewField
                label="Title"
                value={project.title}
                onChange={(value) =>
                  updateProject(index, "title", value)
                }
              />
              <ReviewField
                label="Description"
                value={project.description}
                onChange={(value) =>
                  updateProject(index, "description", value)
                }
                multiline
              />
              <ReviewField
                label="Stack"
                value={project.stack.join(", ")}
                onChange={(value) => updateProjectStack(index, value)}
              />
              <div className="resume-field-grid">
                <ReviewField
                  label="GitHub URL"
                  value={project.githubUrl || ""}
                  onChange={(value) =>
                    updateProject(index, "githubUrl", value)
                  }
                />
                <ReviewField
                  label="Live URL"
                  value={project.liveUrl || ""}
                  onChange={(value) =>
                    updateProject(index, "liveUrl", value)
                  }
                />
              </div>
              <button
                type="button"
                className="danger-link"
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          projects: current.projects.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        }
                      : current
                  )
                }
              >
                Remove project
              </button>
            </div>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection
        title={`Skills · ${draft.skills.length}`}
        included={include.skills}
        onToggle={() =>
          setInclude((current) => ({
            ...current,
            skills: !current.skills,
          }))
        }
      >
        <ReviewField
          label="Skills"
          value={draft.skills.join(", ")}
          onChange={updateSkills}
          multiline
        />
      </ReviewSection>
    </div>
  );
}

function ReviewSection({
  title,
  included,
  onToggle,
  children,
}: {
  title: string;
  included: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`resume-review-section ${included ? "" : "excluded"}`}>
      <div className="resume-review-section-head">
        <strong>{title}</strong>
        <label>
          <input type="checkbox" checked={included} onChange={onToggle} />
          Import
        </label>
      </div>
      <div className="resume-review-section-body">{children}</div>
    </section>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="field resume-review-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
