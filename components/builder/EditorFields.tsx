import { useState } from "react";

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
