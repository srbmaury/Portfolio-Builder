"use client";

import { useEffect, useMemo, useState } from "react";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import {
  encodeSnapshot,
  sampleSnapshot,
  slugify,
  templateCatalog,
  type PortfolioSnapshot,
  type SectionType,
  type ThemeName,
} from "@/lib/portfolio";

const STORAGE_KEY = "portfolio-builder:v1";

export function PortfolioBuilder() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(sampleSnapshot);
  const [tab, setTab] = useState<"content" | "design">("content");
  const [hydrated, setHydrated] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSnapshot(JSON.parse(saved) as PortfolioSnapshot);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    }
  }, [hydrated, snapshot]);

  const visibleSections = useMemo(
    () => snapshot.config.sections.filter((section) => section.visible).length,
    [snapshot.config.sections]
  );

  function updateProfile(\n    field: "name" | "role" | "tagline" | "about" | "email" | "location" | "availability",\n    value: string\n  ) {
    setSnapshot((current) => ({
      ...current,
      data: {
        ...current.data,
        profile: { ...current.data.profile, [field]: value },
      },
    }));
  }

  function updateTheme(theme: ThemeName) {
    setSnapshot((current) => ({
      ...current,
      config: { ...current.config, theme },
    }));
  }

  function setVariant(id: SectionType, variant: string) {
    setSnapshot((current) => ({
      ...current,
      config: {
        ...current.config,
        sections: current.config.sections.map((section) =>
          section.id === id ? { ...section, variant } : section
        ),
      },
    }));
  }

  function toggleSection(id: SectionType) {
    setSnapshot((current) => ({
      ...current,
      config: {
        ...current.config,
        sections: current.config.sections.map((section) =>
          section.id === id ? { ...section, visible: !section.visible } : section
        ),
      },
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSnapshot((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.config.sections.length) return current;
      const sections = [...current.config.sections];
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
      return { ...current, config: { ...current.config, sections } };
    });
  }

  function updateProject(index: number, field: "title" | "description", value: string) {
    setSnapshot((current) => ({
      ...current,
      data: {
        ...current.data,
        projects: current.data.projects.map((project, projectIndex) =>
          projectIndex === index ? { ...project, [field]: value } : project
        ),
      },
    }));
  }

  function addProject() {
    setSnapshot((current) => ({
      ...current,
      data: {
        ...current.data,
        projects: [
          ...current.data.projects,
          {
            title: "New project",
            description: "Describe the problem, what you built, and the outcome.",
            stack: ["React", "API"],
          },
        ],
      },
    }));
  }

  async function publish() {
    const encoded = encodeSnapshot(snapshot);
    const url = `${window.location.origin}/p/${slugify(snapshot.data.profile.name)}?data=${encoded}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be blocked in some preview environments; the URL stays selectable below.
    }
  }

  function reset() {
    setSnapshot(sampleSnapshot);
    setShareUrl("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="builder-shell">
      <header className="builder-topbar">
        <a className="brand" href="/">folio<span>blocks</span></a>
        <div className="builder-status">
          <span className="save-dot" />
          Saved locally
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={reset}>Reset demo</button>
          <button className="primary-button" onClick={publish}>Publish & copy link</button>
        </div>
      </header>

      <div className="builder-grid">
        <aside className="builder-panel">
          <div className="panel-tabs">
            <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>
              Content
            </button>
            <button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>
              Design
            </button>
          </div>

          {tab === "content" ? (
            <div className="panel-body">
              <div className="panel-intro">
                <p className="panel-kicker">Profile</p>
                <h2>Tell your story once.</h2>
                <p>Every section below reuses the same structured content.</p>
              </div>

              <Field label="Name" value={snapshot.data.profile.name} onChange={(value) => updateProfile("name", value)} />
              <Field label="Role" value={snapshot.data.profile.role} onChange={(value) => updateProfile("role", value)} />
              <Field label="Tagline" multiline value={snapshot.data.profile.tagline} onChange={(value) => updateProfile("tagline", value)} />
              <Field label="About" multiline value={snapshot.data.profile.about} onChange={(value) => updateProfile("about", value)} />
              <Field label="Email" value={snapshot.data.profile.email} onChange={(value) => updateProfile("email", value)} />
              <Field label="Location" value={snapshot.data.profile.location} onChange={(value) => updateProfile("location", value)} />
              <Field label="Availability" multiline value={snapshot.data.profile.availability} onChange={(value) => updateProfile("availability", value)} />

              <div className="editor-group">
                <div className="editor-group-title">
                  <div><span>Projects</span><small>{snapshot.data.projects.length} total</small></div>
                  <button onClick={addProject}>+ Add</button>
                </div>
                {snapshot.data.projects.map((project, index) => (
                  <div key={index} className="project-editor">
                    <Field label={`Project ${index + 1}`} value={project.title} onChange={(value) => updateProject(index, "title", value)} />
                    <Field label="Description" multiline value={project.description} onChange={(value) => updateProject(index, "description", value)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel-body">
              <div className="panel-intro">
                <p className="panel-kicker">Design system</p>
                <h2>Swap the pieces.</h2>
                <p>{visibleSections} sections are visible. Your content never changes when the layout does.</p>
              </div>

              <div className="theme-picker">
                <label>Theme</label>
                <div className="theme-options">
                  {(["ink", "sand", "moss"] as ThemeName[]).map((theme) => (
                    <button
                      key={theme}
                      className={`theme-swatch swatch-${theme} ${snapshot.config.theme === theme ? "active" : ""}`}
                      onClick={() => updateTheme(theme)}
                      aria-label={`Use ${theme} theme`}
                    >
                      <span />
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-config-list">
                {snapshot.config.sections.map((section, index) => (
                  <div className="section-config" key={section.id}>
                    <div className="section-config-head">
                      <div>
                        <strong>{section.id}</strong>
                        <small>{section.visible ? section.variant : "hidden"}</small>
                      </div>
                      <div className="section-actions">
                        <button onClick={() => moveSection(index, -1)} disabled={index === 0}>↑</button>
                        <button onClick={() => moveSection(index, 1)} disabled={index === snapshot.config.sections.length - 1}>↓</button>
                        <button onClick={() => toggleSection(section.id)}>{section.visible ? "Hide" : "Show"}</button>
                      </div>
                    </div>

                    {section.visible && (
                      <div className="variant-grid">
                        {templateCatalog[section.id].map((variant) => (
                          <button
                            key={variant.id}
                            className={section.variant === variant.id ? "variant-card active" : "variant-card"}
                            onClick={() => setVariant(section.id, variant.id)}
                          >
                            <span className={`variant-preview variant-${variant.id}`}>
                              <i /><i /><i />
                            </span>
                            <strong>{variant.label}</strong>
                            <small>{variant.description}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {shareUrl && (
            <div className="publish-toast">
              <div>
                <strong>Portfolio link ready</strong>
                <p>Copied to clipboard. This MVP encodes the portfolio into the share URL, so it works without a backend.</p>
              </div>
              <a href={shareUrl} target="_blank" rel="noreferrer">Open ↗</a>
            </div>
          )}
        </aside>

        <section className="preview-stage">
          <div className="preview-toolbar">
            <span>Live preview</span>
            <span>{snapshot.config.theme} theme · {visibleSections} sections</span>
          </div>
          <div className="preview-window">
            <PortfolioRenderer snapshot={snapshot} compact />
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
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
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}
