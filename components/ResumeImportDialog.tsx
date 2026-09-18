"use client";

import { useEffect, useState } from "react";
import type { ResumeImportDraft } from "@/lib/resume-parser";
import { validateResumeFileMetadata } from "@/lib/resume-upload";
import { trackProductEvent } from "@/lib/product-analytics";
import { useDialogFocusTrap } from "@/lib/accessibility";

type IncludeState = {
  profile: boolean;
  experience: boolean;
  projects: boolean;
  skills: boolean;
};

export function ResumeImportDialog({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (draft: ResumeImportDraft) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ResumeImportDraft | null>(null);
  const [include, setInclude] = useState<IncludeState>({
    profile: true,
    experience: true,
    projects: true,
    skills: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(() => {
    if (!busy) onClose();
  });

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => {
      document.body.classList.remove("dialog-open");
    };
  }, []);

  function chooseFile(next?: File) {
    setError("");
    setDraft(null);

    if (!next) {
      setFile(null);
      return;
    }

    const validation = validateResumeFileMetadata(next);
    if (!validation.ok) {
      setFile(null);
      setError(validation.error);
      return;
    }

    setFile(next);
  }

  async function parseResume() {
    if (!file) {
      setError("Choose a PDF or DOCX resume first.");
      return;
    }

    setBusy(true);
    setError("");
    trackProductEvent("resume_import_started");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        draft?: ResumeImportDraft;
        error?: string;
      };

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error || "Could not parse resume.");
      }

      setDraft(payload.draft);
      trackProductEvent("resume_import_succeeded");
    } catch (parseError) {
      trackProductEvent("resume_import_failed");
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Could not parse resume."
      );
    } finally {
      setBusy(false);
    }
  }

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

  function apply() {
    if (!draft) return;

    onApply({
      profile: include.profile
        ? draft.profile
        : { socials: [] },
      experience: include.experience ? draft.experience : [],
      projects: include.projects ? draft.projects : [],
      skills: include.skills ? draft.skills : [],
    });
  }

  return (
    <div
      className="create-dialog-backdrop resume-import-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="create-dialog resume-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-import-title"
      >
        <div className="create-dialog-head">
          <div>
            <p className="panel-kicker">Resume import</p>
            <h2 id="resume-import-title">
              {draft ? "Review before applying." : "Start from your resume."}
            </h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close resume import"
          >
            ×
          </button>
        </div>

        {!draft ? (
          <div className="resume-upload-step">
            <label className="resume-dropzone">
              <strong>Choose PDF or DOCX</strong>
              <span>Maximum 5 MB. Your file is parsed in memory and is not stored.</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>

            {file ? (
              <div className="resume-file-row">
                <span>
                  <strong>{file.name}</strong>
                  <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                </span>
                <button type="button" onClick={() => chooseFile()}>
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        ) : (
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
        )}

        {error ? (
          <p className="create-dialog-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="create-dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {draft ? (
            <button type="button" className="primary-button" onClick={apply}>
              Apply to portfolio
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={parseResume}
              disabled={!file || busy}
            >
              {busy ? "Reading resume…" : "Review import"}
            </button>
          )}
        </div>
      </div>
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
