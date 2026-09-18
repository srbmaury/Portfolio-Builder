"use client";

import { useEffect, useRef, useState } from "react";
import {
  uploadImageToCloudinary,
  uploadResumeToCloudinary,
  type CloudinaryUploadScope,
} from "@/lib/cloudinary";
import { useDialogFocusTrap } from "@/lib/accessibility";
import type { CreateDialogKind } from "@/components/builder/types";

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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("dialog-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("dialog-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

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
              <DialogField label="Summary" multiline value={values.summary} onChange={(value) => update("summary", value)} required />
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
              <DialogField label="Target role" placeholder="Backend Engineer" value={values.targetRole} onChange={(value) => update("targetRole", value)} required />
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

export function ImageUploadField({
  label,
  value,
  onChange,
  help,
  uploadScope = { scope: "shared" },
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  uploadScope?: CloudinaryUploadScope;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file.");
      return;
    }

    setBusy(true);
    setStatus("Uploading…");

    try {
      const result = await uploadImageToCloudinary(file, uploadScope);
      onChange(result.secure_url);
      setStatus("Uploaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field image-upload-field">
      <span>{label}</span>
      {value ? (
        <div className="image-upload-preview">
          <img src={value} alt="" />
          <button type="button" className="danger-link" onClick={() => onChange("")}>
            Remove
          </button>
        </div>
      ) : null}
      <label className={`image-upload-button ${busy ? "disabled" : ""}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          disabled={busy}
          onChange={(event) => upload(event.target.files?.[0])}
        />
        {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
      </label>
      {help && <small className="field-help">{help}</small>}
      {status && <small className="upload-status">{status}</small>}
    </div>
  );
}

export function ResumeUploadField({
  value,
  variantKey,
  onChange,
}: {
  value: { url: string; publicId: string; fileName: string };
  variantKey: string;
  onChange: (value: { url: string; publicId: string; fileName: string }) => void;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;

    setBusy(true);
    setStatus("Uploading…");

    try {
      const result = await uploadResumeToCloudinary(file, variantKey);
      onChange({
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.name,
      });
      setStatus("Resume uploaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field resume-upload-field">
      <span>Public resume PDF</span>
      {value.url ? (
        <div className="resume-upload-current">
          <div>
            <strong>{value.fileName || "Resume.pdf"}</strong>
            <a href={value.url} target="_blank" rel="noreferrer">
              Open PDF ↗
            </a>
          </div>
          <button
            type="button"
            className="danger-link"
            onClick={() =>
              onChange({ url: "", publicId: "", fileName: "" })
            }
          >
            Remove
          </button>
        </div>
      ) : null}
      <label className={`image-upload-button ${busy ? "disabled" : ""}`}>
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(event) => upload(event.target.files?.[0])}
        />
        {busy ? "Uploading…" : value.url ? "Replace resume" : "Upload PDF"}
      </label>
      <small className="field-help">
        PDF only, up to 5 MB. Visitors can view it inside the portfolio or open it in a new tab.
      </small>
      {status ? <small className="upload-status">{status}</small> : null}
    </div>
  );
}

export function EditorSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`editor-section ${isOpen ? "open" : ""}`}>
      <div className="editor-section-heading">
        <button
          type="button"
          className="editor-section-toggle"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
          <span className="editor-chevron">⌄</span>
        </button>

        {actionLabel && onAction && (
          <button
            type="button"
            className="editor-section-action"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {isOpen && <div className="editor-section-body">{children}</div>}
    </section>
  );
}

export function EditorCard({
  title,
  onDelete,
  children,
}: {
  title: string;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={`editor-card ${isOpen ? "open" : ""}`}>
      <div className="editor-card-heading">
        <button
          type="button"
          className="editor-card-toggle"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <strong>{title}</strong>
          <span>{isOpen ? "−" : "+"}</span>
        </button>
        <button type="button" className="danger-link" onClick={onDelete}>
          Remove
        </button>
      </div>

      {isOpen && <div className="editor-card-body">{children}</div>}
    </section>
  );
}

export function TargetingSection({
  title,
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  children,
}: {
  title: string;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="targeting-section">
      <div className="targeting-section-head">
        <div>
          <strong>{title}</strong>
          <span>
            {selectedCount} of {totalCount} shown
          </span>
        </div>
        <div>
          <button onClick={onSelectAll}>All</button>
          <button onClick={onClear}>None</button>
        </div>
      </div>
      <div className="targeting-list">{children}</div>
    </section>
  );
}

export function TargetRow({
  label,
  detail,
  selected,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className={`target-row ${selected ? "selected" : ""}`}>
      <label>
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span>
          <strong>{label}</strong>
          {detail && <small>{detail}</small>}
        </span>
      </label>
      <div className="target-order-actions">
        <button onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${label} up`}>
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={`Move ${label} down`}
        >
          ↓
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

