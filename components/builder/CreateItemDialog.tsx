import { ImageUploadField } from "./UploadFields";
import { useState, useEffect } from "react";
import { formatExperienceBullets } from "@/lib/portfolio-prose";
import { useDialogFocusTrap } from "@/lib/accessibility";
import type { CreateDialogKind } from "./types";

export function CreateItemDialog({
  kind,
  defaultTargetRole,
  onClose,
  onCreateExperience,
  onCreateProject,
  onCreateLink,
  onCreateVariant,
  onCreateCustomSection,
}: {
  kind: Exclude<CreateDialogKind, null>;
  defaultTargetRole: string;
  onClose: () => void;
  onCreateExperience: (input: {
    company: string;
    role: string;
    period: string;
    summary: string;
  }) => void;
  onCreateProject: (input: {
    title: string;
    description: string;
    stack: string[];
    imageUrl?: string;
    githubUrl?: string;
    liveUrl?: string;
  }) => void;
  onCreateLink: (input: { label: string; url: string }) => void;
  onCreateVariant: (input: { name: string; targetRole: string }) => void;
  onCreateCustomSection: (title: string) => void;
}) {
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() => ({
    company: "",
    role: "",
    period: "",
    summary: "",
    title: "",
    description: "",
    stack: "",
    imageUrl: "",
    githubUrl: "",
    liveUrl: "",
    label: "",
    url: "",
    name: "",
    sectionTitle: "",
    targetRole: kind === "variant" ? defaultTargetRole : "",
  }));

  const dialogRef = useDialogFocusTrap<HTMLFormElement>(onClose);

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => {
      document.body.classList.remove("dialog-open");
    };
  }, []);

  function update(key: string, value: string) {
    setError("");
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (kind === "experience") {
      const company = values.company.trim();
      const role = values.role.trim();
      const period = values.period.trim();
      const summary = values.summary.trim();

      if (!company || !role || !period || !summary) {
        setError("Complete all experience fields before adding it.");
        return;
      }

      onCreateExperience({ company, role, period, summary });
      return;
    }

    if (kind === "project") {
      const title = values.title.trim();
      const description = values.description.trim();
      const stack = values.stack
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (!title || !description || stack.length === 0) {
        setError("Add a title, description, and at least one technology.");
        return;
      }

      onCreateProject({
        title,
        description,
        stack,
        imageUrl: values.imageUrl.trim() || undefined,
        githubUrl: values.githubUrl.trim() || undefined,
        liveUrl: values.liveUrl.trim() || undefined,
      });
      return;
    }

    if (kind === "link") {
      const label = values.label.trim();
      const url = values.url.trim();

      if (!label || !url) {
        setError("Add both a label and URL.");
        return;
      }

      onCreateLink({ label, url });
      return;
    }

    if (kind === "custom-section") {
      const sectionTitle = values.sectionTitle.trim();
      if (!sectionTitle) {
        setError("Add a section title before creating it.");
        return;
      }
      onCreateCustomSection(sectionTitle);
      return;
    }

    const name = values.name.trim();
    const targetRole = values.targetRole.trim();

    if (!name || !targetRole) {
      setError("Add both a portfolio name and target role.");
      return;
    }

    onCreateVariant({ name, targetRole });
  }

  const title =
    kind === "experience"
      ? "Add experience"
      : kind === "project"
        ? "Add project"
        : kind === "link"
          ? "Add link"
          : kind === "custom-section"
            ? "Add custom section"
            : "Create portfolio variant";

  const submitLabel =
    kind === "experience"
      ? "Add experience"
      : kind === "project"
        ? "Add project"
        : kind === "link"
          ? "Add link"
          : kind === "custom-section"
            ? "Add section"
            : "Create portfolio";

  return (
    <div
      className="create-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={dialogRef}
        className="create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-dialog-title"
        onSubmit={submit}
      >
        <div className="create-dialog-head">
          <div>
            <p className="panel-kicker">Add details</p>
            <h2 id="create-dialog-title">{title}</h2>
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="create-dialog-body">
          {kind === "experience" && (
            <>
              <DialogField label="Company" value={values.company} onChange={(value) => update("company", value)} autoFocus required />
              <DialogField label="Role" value={values.role} onChange={(value) => update("role", value)} required />
              <DialogField label="Period" placeholder="e.g. 2024 — Present" value={values.period} onChange={(value) => update("period", value)} required />
              <DialogField label="Summary / achievements" placeholder="Write a paragraph, or one achievement per line." multiline value={values.summary} onChange={(value) => update("summary", value)} required />
              <button type="button" disabled={!values.summary.trim()} onClick={() => update("summary", formatExperienceBullets(values.summary))}>Format as bullets</button>
            </>
          )}

          {kind === "project" && (
            <>
              <DialogField label="Project title" value={values.title} onChange={(value) => update("title", value)} autoFocus required />
              <DialogField label="Description" multiline value={values.description} onChange={(value) => update("description", value)} required />
              <DialogField label="Tech stack" placeholder="Java, Redis, PostgreSQL" value={values.stack} onChange={(value) => update("stack", value)} required />
              <ImageUploadField
                label="Project image"
                value={values.imageUrl}
                onChange={(value) => update("imageUrl", value)}
                help="Optional. Upload a screenshot or visual for image-based project layouts."
              />
              <DialogField label="GitHub URL" placeholder="https://github.com/..." value={values.githubUrl} onChange={(value) => update("githubUrl", value)} type="url" />
              <DialogField label="Live URL" placeholder="https://..." value={values.liveUrl} onChange={(value) => update("liveUrl", value)} type="url" />
            </>
          )}

          {kind === "link" && (
            <>
              <DialogField label="Label" placeholder="GitHub, LinkedIn, Website..." value={values.label} onChange={(value) => update("label", value)} autoFocus required />
              <DialogField label="URL" placeholder="https://..." value={values.url} onChange={(value) => update("url", value)} type="url" required />
            </>
          )}

          {kind === "custom-section" && (
            <>
              <DialogField
                label="Section title"
                placeholder="Education, Certifications, Awards..."
                value={values.sectionTitle}
                onChange={(value) => update("sectionTitle", value)}
                autoFocus
                required
              />
              <p className="dialog-hint">
                Add flexible items afterward. The section is visible in this
                portfolio and available, hidden, in your other variants.
              </p>
            </>
          )}

          {kind === "variant" && (
            <>
              <DialogField label="Portfolio name" placeholder="Backend, AI, General..." value={values.name} onChange={(value) => update("name", value)} autoFocus required />
              <DialogField label="Role" placeholder="Backend Engineer" value={values.targetRole} onChange={(value) => update("targetRole", value)} required />
              <p className="dialog-hint">
                The new variant starts with the current portfolio's design and targeted content. You can customize both afterward.
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="create-dialog-error" role="alert">
            {error}
          </p>
        )}

        <div className="create-dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function DialogField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  required = false,
  type = "text",
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="field dialog-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          required={required}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          autoFocus={autoFocus}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
