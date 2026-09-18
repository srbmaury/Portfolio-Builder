"use client";

import { useEffect, useMemo, useState } from "react";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { createClient } from "@/lib/supabase/client";
import {
  loadBuilderState,
  publishVariant,
  saveBuilderState,
} from "@/lib/supabase/portfolio-store";
import {
  cloneConfig,
  cloneContentConfig,
  createEntityId,
  defaultConfig,
  fullContentConfig,
  normalizeBuilderState,
  sampleBuilderState,
  slugify,
  snapshotForVariant,
  templateCatalog,
  type BuilderState,
  type Experience,
  type PortfolioConfig,
  type PortfolioData,
  type Project,
  type SectionType,
  type ThemeName,
} from "@/lib/portfolio";

const STORAGE_KEY = "folioblocks:workspace";
const EDITOR_WIDTH_KEY = "folioblocks:editor-width";

type PreviewMode = "desktop" | "tablet" | "mobile";

export function PortfolioBuilder() {
  const [state, setState] = useState<BuilderState>(sampleBuilderState);
  const [tab, setTab] = useState<"content" | "targeting" | "design">("content");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [hydrated, setHydrated] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"local" | "loading" | "saved" | "error">("local");
  const [cloudMessage, setCloudMessage] = useState("");
  const [editorWidth, setEditorWidth] = useState(420);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const savedWidth = Number(window.localStorage.getItem(EDITOR_WIDTH_KEY));

    if (saved) {
      try {
        setState(normalizeBuilderState(JSON.parse(saved) as BuilderState));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (Number.isFinite(savedWidth) && savedWidth >= 320 && savedWidth <= 720) {
      setEditorWidth(savedWidth);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(EDITOR_WIDTH_KEY, String(editorWidth));
    }
  }, [editorWidth, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function loadCloudWorkspace() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !data.user) {
        setCloudUserId(null);
        setCloudStatus("local");
        return;
      }

      setCloudUserId(data.user.id);
      setCloudStatus("loading");

      try {
        const remote = await loadBuilderState(supabase, data.user);
        if (cancelled) return;

        if (remote) {
          setState(remote);
          setCloudMessage("Loaded from cloud");
          setCloudStatus("saved");
        } else {
          setCloudMessage("Signed in · local draft not saved yet");
          setCloudStatus("local");
        }
      } catch (loadError) {
        if (cancelled) return;
        setCloudMessage(
          loadError instanceof Error ? loadError.message : "Could not load cloud workspace"
        );
        setCloudStatus("error");
      }
    }

    loadCloudWorkspace();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const activeVariant =
    state.variants.find((variant) => variant.id === state.activeVariantId) ??
    state.variants[0];

  const snapshot = useMemo(() => snapshotForVariant(state), [state]);
  const visibleSections = snapshot.config.sections.filter((section) => section.visible).length;

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
      ...activeVariant.content.skills.filter((skill) => state.data.skills.includes(skill)),
      ...state.data.skills.filter((skill) => !selected.has(skill)),
    ];
  }, [activeVariant, state.data.skills]);

  function updateData(updater: (data: PortfolioData) => PortfolioData) {
    setState((current) => ({ ...current, data: updater(current.data) }));
  }

  function updateActiveConfig(updater: (config: PortfolioConfig) => PortfolioConfig) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, config: updater(variant.config) }
          : variant
      ),
    }));
  }

  function updateActiveContent(
    field: "experienceIds" | "projectIds" | "skills",
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

  function toggleTarget(
    field: "experienceIds" | "projectIds" | "skills",
    value: string
  ) {
    updateActiveContent(field, (items) =>
      items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value]
    );
  }

  function moveTarget(
    field: "experienceIds" | "projectIds" | "skills",
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

  function selectAllTargets(
    field: "experienceIds" | "projectIds" | "skills"
  ) {
    const all =
      field === "experienceIds"
        ? state.data.experience.map((item) => item.id)
        : field === "projectIds"
          ? state.data.projects.map((item) => item.id)
          : state.data.skills;
    updateActiveContent(field, () => [...all]);
  }

  function clearTargets(field: "experienceIds" | "projectIds" | "skills") {
    updateActiveContent(field, () => []);
  }

  function updateProfile(
    field: "name" | "role" | "tagline" | "about" | "email" | "location" | "availability",
    value: string
  ) {
    updateData((data) => ({
      ...data,
      profile: { ...data.profile, [field]: value },
    }));
  }

  function updateTheme(theme: ThemeName) {
    updateActiveConfig((config) => ({ ...config, theme }));
  }

  function setVariant(id: SectionType, variantName: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === id ? { ...section, variant: variantName } : section
      ),
    }));
  }

  function toggleSection(id: SectionType) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      ),
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    updateActiveConfig((config) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= config.sections.length) return config;
      const sections = [...config.sections];
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
      return { ...config, sections };
    });
  }

  function shuffleDesign() {
    const themes: ThemeName[] = ["ink", "sand", "moss"];
    updateActiveConfig((config) => ({
      ...config,
      theme: themes[Math.floor(Math.random() * themes.length)],
      sections: config.sections.map((section) => {
        const options = templateCatalog[section.id];
        return {
          ...section,
          variant: options[Math.floor(Math.random() * options.length)].id,
        };
      }),
    }));
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

  function addExperience() {
    const id = createEntityId("experience");
    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        experience: [
          ...current.data.experience,
          {
            id,
            company: "Company",
            role: "Role",
            period: "2026 — Present",
            summary: "Describe what you owned, what changed, and the outcome.",
          },
        ],
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
    field: "title" | "description" | "url",
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

  function addProject() {
    const id = createEntityId("project");
    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        projects: [
          ...current.data.projects,
          {
            id,
            title: "New project",
            description: "Describe the problem, what you built, and the outcome.",
            stack: ["React", "API"],
            url: "",
          },
        ],
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

  function updateSocial(index: number, field: "label" | "url", value: string) {
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

  function addSocial() {
    updateData((data) => ({
      ...data,
      profile: {
        ...data.profile,
        socials: [...data.profile.socials, { label: "Website", url: "https://" }],
      },
    }));
  }

  function removeSocial(index: number) {
    updateData((data) => ({
      ...data,
      profile: {
        ...data.profile,
        socials: data.profile.socials.filter((_, socialIndex) => socialIndex !== index),
      },
    }));
  }

  function createVariant() {
    const currentConfig = activeVariant?.config ?? defaultConfig;
    const number = state.variants.length + 1;
    const id = `portfolio-${number}-${Date.now().toString(36)}`;

    setState((current) => ({
      ...current,
      activeVariantId: id,
      variants: [
        ...current.variants,
        {
          id,
          name: `Portfolio ${number}`,
          targetRole: current.data.profile.role,
          config: cloneConfig(currentConfig),
          content: cloneContentConfig(
            activeVariant?.content ?? fullContentConfig(current.data)
          ),
        },
      ],
    }));

    setShareUrl("");
  }

  function duplicateVariant() {
    if (!activeVariant) return;
    const id = `${slugify(activeVariant.name)}-copy-${Date.now().toString(36)}`;

    setState((current) => ({
      ...current,
      activeVariantId: id,
      variants: [
        ...current.variants,
        {
          id,
          name: `${activeVariant.name} Copy`,
          targetRole: activeVariant.targetRole,
          config: cloneConfig(activeVariant.config),
          content: cloneContentConfig(activeVariant.content),
        },
      ],
    }));

    setShareUrl("");
  }

  function removeActiveVariant() {
    if (state.variants.length <= 1) return;

    setState((current) => {
      const remaining = current.variants.filter(
        (variant) => variant.id !== current.activeVariantId
      );

      return {
        ...current,
        variants: remaining,
        activeVariantId: remaining[0].id,
      };
    });

    setShareUrl("");
  }

  function updateVariantMeta(field: "name" | "targetRole", value: string) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, [field]: value }
          : variant
      ),
    }));
  }

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    if (window.innerWidth <= 760) return;

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = editorWidth;

    document.body.classList.add("builder-resizing");

    function onPointerMove(moveEvent: PointerEvent) {
      const maxWidth = Math.min(720, window.innerWidth - 460);
      const nextWidth = Math.max(
        320,
        Math.min(maxWidth, startWidth + moveEvent.clientX - startX)
      );
      setEditorWidth(nextWidth);
    }

    function stopResize() {
      document.body.classList.remove("builder-resizing");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }

  async function saveToCloud() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return;
    }

    setCloudStatus("loading");
    setCloudMessage("Saving…");

    try {
      await saveBuilderState(supabase, data.user, state);
      setCloudUserId(data.user.id);
      setCloudStatus("saved");
      setCloudMessage("Saved to cloud");
    } catch (saveError) {
      setCloudStatus("error");
      setCloudMessage(
        saveError instanceof Error ? saveError.message : "Cloud save failed"
      );
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCloudUserId(null);
    setCloudStatus("local");
    setCloudMessage("Signed out · local draft preserved");
  }

  async function publish() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return;
    }

    setCloudStatus("loading");
    setCloudMessage("Publishing…");

    try {
      await saveBuilderState(supabase, data.user, state);
      const publicPath = await publishVariant(supabase, data.user, state);
      const url = `${window.location.origin}/u/${publicPath}`;

      setShareUrl(url);
      setCloudUserId(data.user.id);
      setCloudStatus("saved");
      setCloudMessage("Published from cloud");

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard can be blocked in some preview environments.
      }
    } catch (publishError) {
      setCloudStatus("error");
      setCloudMessage(
        publishError instanceof Error ? publishError.message : "Publish failed"
      );
    }
  }

  function reset() {
    setState(sampleBuilderState);
    setShareUrl("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="builder-shell">
      <header className="builder-topbar">
        <a className="brand" href="/">
          folio<span>blocks</span>
        </a>

        <div className="builder-status" title={cloudMessage || undefined}>
          <span className={`save-dot cloud-${cloudStatus}`} />
          {cloudUserId
            ? cloudStatus === "loading"
              ? "Syncing cloud…"
              : cloudStatus === "error"
                ? "Cloud error"
                : cloudStatus === "saved"
                  ? "Saved to cloud"
                  : "Cloud ready"
            : "Saved locally"}
        </div>

        <div className="topbar-actions">
          {cloudUserId ? (
            <>
              <button className="ghost-button" onClick={saveToCloud}>
                Save cloud
              </button>
              <button className="ghost-button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <a className="ghost-button cloud-login-link" href="/login">
              Sign in
            </a>
          )}
          <button className="ghost-button reset-button" onClick={reset}>
            Reset demo
          </button>
          <button className="primary-button" onClick={publish}>
            Publish & copy link
          </button>
        </div>
      </header>

      <div
        className="builder-grid"
        style={{ "--editor-width": `${editorWidth}px` } as React.CSSProperties}
      >
        <aside className="builder-panel">
          <div className="panel-tabs panel-tabs-three">
            <button
              className={tab === "content" ? "active" : ""}
              onClick={() => setTab("content")}
            >
              Content
            </button>
            <button
              className={tab === "targeting" ? "active" : ""}
              onClick={() => setTab("targeting")}
            >
              Targeting
            </button>
            <button
              className={tab === "design" ? "active" : ""}
              onClick={() => setTab("design")}
            >
              Design
            </button>
          </div>

          <div className="variant-switcher">
            <div className="variant-switcher-head">
              <div>
                <span>Portfolio variants</span>
                <small>One profile, multiple presentations</small>
              </div>
              <button onClick={createVariant}>+ New</button>
            </div>

            <div className="variant-pills">
              {state.variants.map((variant) => (
                <button
                  key={variant.id}
                  className={variant.id === state.activeVariantId ? "active" : ""}
                  onClick={() => {
                    setState((current) => ({
                      ...current,
                      activeVariantId: variant.id,
                    }));
                    setShareUrl("");
                  }}
                >
                  {variant.name}
                </button>
              ))}
            </div>

            {activeVariant && (
              <div className="variant-meta-grid">
                <Field
                  label="Variant name"
                  value={activeVariant.name}
                  onChange={(value) => updateVariantMeta("name", value)}
                />
                <Field
                  label="Target role"
                  value={activeVariant.targetRole}
                  onChange={(value) => updateVariantMeta("targetRole", value)}
                />
                <div className="variant-meta-actions">
                  <button onClick={duplicateVariant}>Duplicate</button>
                  <button
                    className="danger-link"
                    onClick={removeActiveVariant}
                    disabled={state.variants.length <= 1}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {tab === "content" ? (
            <div className="panel-body">
              <div className="panel-intro">
                <p className="panel-kicker">Shared profile</p>
                <h2>Tell your story once.</h2>
                <p>
                  Content is shared across every portfolio variant. Change it here and
                  each version stays up to date.
                </p>
              </div>

              <EditorSection title="Profile" subtitle="Identity and positioning" defaultOpen>
                <Field
                  label="Name"
                  value={state.data.profile.name}
                  onChange={(value) => updateProfile("name", value)}
                />
                <Field
                  label="Role"
                  value={state.data.profile.role}
                  onChange={(value) => updateProfile("role", value)}
                />
                <Field
                  label="Tagline"
                  multiline
                  value={state.data.profile.tagline}
                  onChange={(value) => updateProfile("tagline", value)}
                />
                <Field
                  label="About"
                  multiline
                  value={state.data.profile.about}
                  onChange={(value) => updateProfile("about", value)}
                />
                <Field
                  label="Email"
                  value={state.data.profile.email}
                  onChange={(value) => updateProfile("email", value)}
                />
                <Field
                  label="Location"
                  value={state.data.profile.location}
                  onChange={(value) => updateProfile("location", value)}
                />
                <Field
                  label="Availability"
                  multiline
                  value={state.data.profile.availability}
                  onChange={(value) => updateProfile("availability", value)}
                />
              </EditorSection>

              <EditorSection
                title="Experience"
                subtitle={`${state.data.experience.length} roles`}
                actionLabel="+ Add"
                onAction={addExperience}
              >
                {state.data.experience.map((item, index) => (
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
                      label="Summary"
                      multiline
                      value={item.summary}
                      onChange={(value) => updateExperience(index, "summary", value)}
                    />
                  </EditorCard>
                ))}
              </EditorSection>

              <EditorSection
                title="Projects"
                subtitle={`${state.data.projects.length} projects`}
                actionLabel="+ Add"
                onAction={addProject}
              >
                {state.data.projects.map((project, index) => (
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
                      label="Description"
                      multiline
                      value={project.description}
                      onChange={(value) => updateProject(index, "description", value)}
                    />
                    <Field
                      label="Stack"
                      value={project.stack.join(", ")}
                      onChange={(value) => updateProjectStack(index, value)}
                      hint="Comma separated"
                    />
                    <Field
                      label="Project URL"
                      value={project.url || ""}
                      onChange={(value) => updateProject(index, "url", value)}
                    />
                  </EditorCard>
                ))}
              </EditorSection>

              <EditorSection title="Skills" subtitle={`${state.data.skills.length} skills`}>
                <Field
                  label="Skills"
                  multiline
                  value={state.data.skills.join(", ")}
                  onChange={updateSkills}
                  hint="Comma separated"
                />
              </EditorSection>

              <EditorSection
                title="Links"
                subtitle={`${state.data.profile.socials.length} links`}
                actionLabel="+ Add"
                onAction={addSocial}
              >
                {state.data.profile.socials.map((social, index) => (
                  <EditorCard
                    key={`social-${index}`}
                    title={social.label || `Link ${index + 1}`}
                    onDelete={() => removeSocial(index)}
                  >
                    <Field
                      label="Label"
                      value={social.label}
                      onChange={(value) => updateSocial(index, "label", value)}
                    />
                    <Field
                      label="URL"
                      value={social.url}
                      onChange={(value) => updateSocial(index, "url", value)}
                    />
                  </EditorCard>
                ))}
              </EditorSection>
            </div>
          ) : tab === "targeting" ? (
            <div className="panel-body">
              <div className="panel-intro">
                <p className="panel-kicker">Role targeting</p>
                <h2>Show the strongest evidence.</h2>
                <p>
                  Choose exactly what {activeVariant?.name || "this portfolio"} shows.
                  Selected items can be reordered independently from the shared profile.
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
          ) : (
            <div className="panel-body">
              <div className="panel-intro design-intro">
                <div>
                  <p className="panel-kicker">Design system</p>
                  <h2>Swap the pieces.</h2>
                  <p>
                    {visibleSections} sections are visible in {activeVariant?.name || "this portfolio"}.
                    Shared content never changes when the layout does.
                  </p>
                </div>
                <button className="shuffle-button" onClick={shuffleDesign}>
                  Shuffle design
                </button>
              </div>

              <div className="theme-picker">
                <label>Theme</label>
                <div className="theme-options">
                  {(["ink", "sand", "moss"] as ThemeName[]).map((theme) => (
                    <button
                      key={theme}
                      className={`theme-swatch swatch-${theme} ${
                        snapshot.config.theme === theme ? "active" : ""
                      }`}
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
                        <button
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${section.id} up`}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSection(index, 1)}
                          disabled={index === snapshot.config.sections.length - 1}
                          aria-label={`Move ${section.id} down`}
                        >
                          ↓
                        </button>
                        <button onClick={() => toggleSection(section.id)}>
                          {section.visible ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {section.visible && (
                      <div className="variant-grid">
                        {templateCatalog[section.id].map((variant) => (
                          <button
                            key={variant.id}
                            className={
                              section.variant === variant.id
                                ? "variant-card active"
                                : "variant-card"
                            }
                            onClick={() => setVariant(section.id, variant.id)}
                          >
                            <span className={`variant-preview variant-${variant.id}`}>
                              <i />
                              <i />
                              <i />
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
                <strong>{activeVariant?.name || "Portfolio"} link ready</strong>
                <p>
                  Copied to clipboard. This is a clean public link backed by Supabase.
                </p>
              </div>
              <a href={shareUrl} target="_blank" rel="noreferrer">
                Open ↗
              </a>
            </div>
          )}
        </aside>

        <button
          type="button"
          className="builder-resizer"
          onPointerDown={startResize}
          aria-label="Resize editor and preview panels"
          title="Drag to resize panels"
        >
          <span />
        </button>

        <section className="preview-stage">
          <div className="preview-toolbar">
            <div>
              <span>Live preview</span>
              <strong>{activeVariant?.name}</strong>
            </div>

            <div className="preview-controls">
              {(["desktop", "tablet", "mobile"] as PreviewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={previewMode === mode ? "active" : ""}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <span>
              {snapshot.config.theme} theme · {visibleSections} sections
            </span>
          </div>

          <div className={`preview-window preview-${previewMode}`}>
            <PortfolioRenderer snapshot={snapshot} compact />
          </div>
        </section>
      </div>
    </div>
  );
}

function EditorSection({
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

function EditorCard({
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

function TargetingSection({
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

function TargetRow({
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

function Field({
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
