"use client";

import { splitProjectDescription, joinProjectDescription, formatExperienceBullets } from "@/lib/portfolio-prose";
import { designPresets, matchesDesignPreset } from "@/lib/design-presets";
import { errorMessage } from "@/lib/error-message";
import { AppNav } from "@/components/AppNav";
import { PublishedDialog } from "@/components/PublishedDialog";
import { QuickStartDialog } from "@/components/QuickStartDialog";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { CreateDialogKind, PreviewMode } from "@/components/builder/types";
import { useEditorResize } from "@/components/builder/useEditorResize";
import { usePortfolioEditorActions } from "@/components/builder/usePortfolioEditorActions";
import {
  CreateItemDialog,
  EditorCard,
  EditorSection,
  Field,
  ImageUploadField,
  ResumeUploadField,
  TargetingSection,
  TargetRow,
} from "@/components/builder/BuilderDialogs";
import { GitHubImportDialog } from "@/components/GitHubImportDialog";
import { PortfolioHealthDialog } from "@/components/PortfolioHealthDialog";
import { ResumeImportDialog } from "@/components/ResumeImportDialog";
import { WorkspaceJsonDialog } from "@/components/WorkspaceJsonDialog";
import {
  githubRepositoryToProject,
  normalizeGitHubRepositoryUrl,
  parseGitHubUsername,
  type GitHubRepositorySummary,
} from "@/lib/github-import";
import { mergeResumeImport } from "@/lib/resume-import";
import {
  useBuilderWorkspace,
  WORKSPACE_STORAGE_KEY,
} from "@/components/builder/useBuilderWorkspace";
import { createClient } from "@/lib/supabase/client";
import { deletePortfolio } from "@/lib/supabase/portfolio-store";
import {
  cloneResume,
  emptyBuilderState,
  normalizeBuilderState,
  sampleBuilderState,
  withFreshContentIds,
  sectionHasContent,
  sectionType,
  snapshotForVariant,
  templateCatalog,
  type BuilderState,
  type SectionType,
  type ThemeName,
} from "@/lib/portfolio";


export function PortfolioBuilder({
  startFresh = false,
  initialVariantId,
  openCreateVariant = false,
  startWithDemo = false,
  quickStart = false,
  accountEmail = null,
  isAdmin = false,
}: {
  startFresh?: boolean;
  initialVariantId?: string;
  openCreateVariant?: boolean;
  startWithDemo?: boolean;
  quickStart?: boolean;
  accountEmail?: string | null;
  isAdmin?: boolean;
}) {
  const {
    state,
    setState,
    hydrated,
    setShareUrl,
    cloudUserId,
    cloudStatus,
    setCloudStatus,
    cloudMessage,
    setCloudMessage,
    cloudResolved,
    requestedVariantMissing,
    hasUnsavedChanges,
    saveToCloud,
    publish,
  } = useBuilderWorkspace({ startFresh, initialVariantId });
  const [tab, setTab] = useState<"content" | "targeting" | "design">("content");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const {
    editorWidth,
    startResize,
    handleResizerKeyDown,
    resetEditorWidth,
  } = useEditorResize();
  const [createDialog, setCreateDialog] = useState<CreateDialogKind>(null);
  const [resumeImportOpen, setResumeImportOpen] = useState(false);
  const [githubImportOpen, setGitHubImportOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [previewInView, setPreviewInView] = useState(false);
  const previewStageRef = useRef<HTMLElement>(null);

  // On phones the preview sits below the whole editor. Track whether it is on
  // screen so the floating button can jump to it, or back to the editor.
  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setPreviewInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const createVariantOpenedRef = useRef(false);
  const demoLoadedRef = useRef(false);
  const quickStartShownRef = useRef(false);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);







  useEffect(() => {
    if (
      !hydrated ||
      !cloudResolved ||
      !openCreateVariant ||
      createVariantOpenedRef.current
    ) {
      return;
    }

    createVariantOpenedRef.current = true;
    setCreateDialog("variant");
  }, [cloudResolved, hydrated, openCreateVariant]);

  // A fresh workspace starts with one focused choice instead of dropping a
  // first-time user into the full editor. Existing drafts, explicit demos and
  // create-variant links skip this prompt.
  useEffect(() => {
    if (
      !quickStart ||
      !startFresh ||
      !hydrated ||
      !cloudResolved ||
      startWithDemo ||
      openCreateVariant ||
      quickStartShownRef.current
    ) {
      return;
    }

    quickStartShownRef.current = true;
    const { profile, experience, projects, skills, customSections } = state.data;
    const hasContent =
      Boolean(profile.name.trim() || profile.role.trim() || profile.tagline.trim()) ||
      experience.length > 0 ||
      projects.length > 0 ||
      skills.length > 0 ||
      customSections.length > 0;

    if (!hasContent) setQuickStartOpen(true);
  }, [
    cloudResolved,
    hydrated,
    openCreateVariant,
    quickStart,
    startFresh,
    startWithDemo,
    state.data,
  ]);

  // The landing page's "Explore 2-role demo" link used to point at a bare
  // /builder, which for a first-time visitor is an empty workspace: the demo
  // was only reachable from the More menu. Loading it is deliberately skipped
  // when the workspace already holds content, so the link can never discard
  // someone's draft.
  useEffect(() => {
    if (!hydrated || !cloudResolved || !startWithDemo || demoLoadedRef.current) {
      return;
    }

    demoLoadedRef.current = true;

    const { profile, experience, projects, skills, customSections } = state.data;
    const hasContent =
      Boolean(profile.name.trim() || profile.role.trim() || profile.tagline.trim()) ||
      experience.length > 0 ||
      projects.length > 0 ||
      skills.length > 0 ||
      customSections.length > 0;

    if (!hasContent) {
      setState(withFreshContentIds(sampleBuilderState));
      setShareUrl("");
    }
  }, [cloudResolved, hydrated, startWithDemo, state.data, setState, setShareUrl]);


  const {
    activeVariant,
    targetedExperience,
    targetedProjects,
    targetedSkills,
    toggleTarget,
    moveTarget,
    selectAllTargets,
    clearTargets,
    updateProfile,
    updateTheme,
    updateBranding,
    updateResume,
    setVariant,
    setSectionTitle,
    toggleSection,
    moveSection,
    shuffleDesign,
    chooseDesignPreset,
    updateExperience,
    addExperience,
    removeExperience,
    updateProject,
    updateProjectStack,
    addProject,
    removeProject,
    updateSkills,
    updateSocial,
    addSocial,
    removeSocial,
    createCustomSection,
    renameCustomSection,
    addCustomItem,
    updateCustomItem,
    removeCustomItem,
    removeCustomSection,
    createVariant,
    duplicateVariant,
    updateVariantMeta,
  } = usePortfolioEditorActions({
    state,
    setState,
    setShareUrl,
  });

  const snapshot = useMemo(() => snapshotForVariant(state), [state]);
  const initialGitHubUsername = useMemo(
    () =>
      state.data.profile.socials
        .map((social) => parseGitHubUsername(social.url))
        .find(Boolean) || "",
    [state.data.profile.socials]
  );
  const existingGitHubUrls = useMemo(
    () =>
      state.data.projects
        .map((project) => project.githubUrl || "")
        .map(normalizeGitHubRepositoryUrl)
        .filter(Boolean),
    [state.data.projects]
  );
  const builderResumeUrl = useMemo(() => {
    const resume = activeVariant?.resume;
    if (!resume?.url) return undefined;

    if (
      cloudUserId &&
      resume.url.includes("/image/upload/") &&
      activeVariant?.id
    ) {
      return `/api/resume/${encodeURIComponent(activeVariant.id)}`;
    }

    return resume.url;
  }, [activeVariant?.id, activeVariant?.resume, cloudUserId]);
  const visibleSections = snapshot.config.sections.filter(
    (section) =>
      section.visible &&
      sectionHasContent(section, snapshot.data, snapshot.meta?.resume)
  ).length;

  function sendPreviewPayload() {
    previewFrameRef.current?.contentWindow?.postMessage(
      {
        type: "folioblocks:preview",
        snapshot,
        publicResumeUrl: builderResumeUrl,
      },
      window.location.origin
    );
  }

  useEffect(() => {
    function handlePreviewReady(event: MessageEvent<{ type?: string }>) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== previewFrameRef.current?.contentWindow) return;
      if (event.data?.type !== "folioblocks:preview-ready") return;
      sendPreviewPayload();
    }

    window.addEventListener("message", handlePreviewReady);
    sendPreviewPayload();

    return () => window.removeEventListener("message", handlePreviewReady);
  }, [snapshot, builderResumeUrl]);

  function applyResumeImport(
    draft: Parameters<typeof mergeResumeImport>[1]
  ) {
    setState((current) => mergeResumeImport(current, draft));
    setResumeImportOpen(false);
    setShareUrl("");
  }

  function applyWorkspaceJson(next: BuilderState) {
    setState(normalizeBuilderState(next));
    setJsonEditorOpen(false);
    setShareUrl("");
  }

  function importGitHubRepositories(
    repositories: GitHubRepositorySummary[]
  ) {
    const existing = new Set(existingGitHubUrls);

    repositories.forEach((repository) => {
      const normalized = normalizeGitHubRepositoryUrl(repository.htmlUrl);
      if (!normalized || existing.has(normalized)) return;

      addProject(githubRepositoryToProject(repository));
      existing.add(normalized);
    });

    setGitHubImportOpen(false);
    setShareUrl("");
  }

  async function removeActiveVariant() {
    if (state.variants.length <= 1 || !activeVariant) return;

    if (
      !window.confirm(
        `Delete “${activeVariant.name || "Untitled"}”? This removes its saved/published data and uploaded assets no longer used by another portfolio.`
      )
    ) {
      return;
    }

    if (cloudUserId) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          throw new Error("Sign in again to delete this portfolio.");
        }

        await deletePortfolio(supabase, data.user, activeVariant.id);
        setCloudMessage("Portfolio deleted from cloud");
        setCloudStatus("saved");
      } catch (deleteError) {
        setCloudMessage(
          errorMessage(deleteError, "Could not delete portfolio")
        );
        setCloudStatus("error");
        return;
      }
    }

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

  function startFreshWorkspace() {
    if (
      !window.confirm(
        "Start a fresh workspace? Your current browser draft will be replaced. Cloud data is unchanged until you save."
      )
    ) {
      return;
    }

    setState(emptyBuilderState);
    setShareUrl("");
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    setCloudMessage(cloudUserId ? "Fresh workspace · not saved yet" : "Fresh local workspace");
    setCloudStatus("local");
  }

  function loadDemo() {
    setState(withFreshContentIds(sampleBuilderState));
    setShareUrl("");
  }

  return (
    <div className="builder-shell">
      <AppNav
        current="builder"
        className="builder-topbar"
        email={accountEmail}
        isAdmin={isAdmin}
        actions={
          <>
            <div className="builder-status" title={cloudMessage || undefined} aria-live="polite">
              <span
                className={`save-dot cloud-${cloudStatus}${hasUnsavedChanges ? " cloud-dirty" : ""}`}
              />
              <span>
                {cloudUserId
                  ? cloudStatus === "loading"
                    ? "Syncing…"
                    : cloudStatus === "error"
                      ? "Cloud error"
                      : hasUnsavedChanges
                        ? "Unsaved changes"
                        : cloudStatus === "saved"
                          ? "Saved"
                          : "Cloud ready"
                  : "Local"}
              </span>
            </div>
            <button
              type="button"
              className="topbar-link topbar-health"
              onClick={() => setHealthOpen(true)}
            >
              Health
            </button>
            {cloudUserId ? (
              <button
                className={
                  hasUnsavedChanges
                    ? "primary-button topbar-save topbar-save-dirty"
                    : "topbar-link topbar-save"
                }
                onClick={saveToCloud}
                disabled={cloudStatus === "loading" || !hasUnsavedChanges}
                title={
                  hasUnsavedChanges
                    ? "Save changes to cloud"
                    : "All changes are saved"
                }
              >
                Save
              </button>
            ) : null}

            <button
              className="primary-button topbar-publish"
              onClick={async () => {
                const url = await publish();
                if (url) setPublishedUrl(url);
              }}
              disabled={
                cloudStatus === "loading" ||
                Boolean(cloudUserId && hasUnsavedChanges)
              }
              title={
                cloudUserId
                  ? hasUnsavedChanges
                    ? "Save changes before publishing"
                    : "Publish and copy public link"
                  : undefined
              }
            >
              {cloudUserId ? (
                hasUnsavedChanges ? (
                  <>
                    <span className="publish-label-desktop">Save changes first</span>
                    <span className="publish-label-mobile">Save first</span>
                  </>
                ) : (
                  "Publish"
                )
              ) : (
                "Sign in to publish"
              )}
            </button>
          </>
        }
        sidebarExtras={
          <button type="button" onClick={() => setHealthOpen(true)}>
            Portfolio health
          </button>
        }
      />

      <div
        className="builder-grid"
        style={{ "--editor-width": `${editorWidth}px` } as CSSProperties}
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

          <div className="builder-panel-scroll">
            {requestedVariantMissing && (
            <p className="builder-notice" role="status">
              That portfolio could not be found, so the most recently edited one
              is shown instead. Check the link, or pick a portfolio below.
            </p>
          )}
          {cloudStatus === "error" && cloudMessage && (
            // The status pill only has room for "Cloud error", and putting the
            // reason in a title attribute meant a failed save looked identical
            // to a network blip unless you happened to hover it.
            <p className="builder-notice builder-notice-error" role="alert">
              Save failed: {cloudMessage}
            </p>
          )}
          <div className="variant-switcher">
            <div className="variant-switcher-head">
              <div>
                <span>Portfolios</span>
                <small>Each portfolio keeps its own content</small>
              </div>
              <button onClick={() => setCreateDialog("variant")}>+ New</button>
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
                  {variant.name || "Untitled"}
                </button>
              ))}
            </div>

            {activeVariant && (
              <div className="variant-meta-grid">
                <Field
                  label="Portfolio name"
                  value={activeVariant.name}
                  onChange={(value) => updateVariantMeta("name", value)}
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
                <h2>Your details</h2>
                <p>
                  Fill in what this portfolio shows, or import it. Your other
                  portfolios are not affected.
                </p>
                <div className="panel-intro-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setResumeImportOpen(true)}
                  >
                    Import resume
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setGitHubImportOpen(true)}
                  >
                    Import GitHub
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setJsonEditorOpen(true)}
                  >
                    Edit as JSON
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={loadDemo}
                  >
                    Load demo
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={startFreshWorkspace}
                  >
                    Start over
                  </button>
                </div>
              </div>

              <EditorSection title="Profile" subtitle="Identity and positioning" defaultOpen>
                <Field
                  label="Name"
                  value={state.data.profile.name}
                  onChange={(value) => updateProfile("name", value)}
                />
                {/* One field for the role this portfolio targets. The published
                    page shows the portfolio's target role over the profile
                    role, so both are kept in step rather than asking twice. */}
                <Field
                  label="Role"
                  value={activeVariant?.targetRole || state.data.profile.role}
                  onChange={(value) => {
                    updateProfile("role", value);
                    updateVariantMeta("targetRole", value);
                  }}
                />
                <Field
                  label="Tagline"
                  multiline
                  value={state.data.profile.tagline}
                  onChange={(value) => updateProfile("tagline", value)}
                />
                <Field
                  label="About"
                  hint="Separate paragraphs with a blank line."
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
                <ImageUploadField
                  label="Hero image"
                  value={state.data.profile.heroImageUrl || ""}
                  onChange={(value) => updateProfile("heroImageUrl", value)}
                  help="Used by image-based hero layouts."
                />
              </EditorSection>

              <EditorSection
                title="Resume"
                subtitle={activeVariant?.resume.url ? "PDF attached" : "Optional PDF"}
              >
                <p className="editor-empty-note">
                  This resume belongs to <strong>{activeVariant?.name || "this portfolio"}</strong>,
                  so different role-specific portfolios can show different resumes.
                </p>
                <ResumeUploadField
                  value={activeVariant?.resume || cloneResume()}
                  variantKey={activeVariant?.id || state.activeVariantId}
                  openUrl={builderResumeUrl}
                  onChange={updateResume}
                />
                <label className="resume-hero-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(activeVariant?.resume.showInHero)}
                    disabled={!activeVariant?.resume.url}
                    onChange={(event) =>
                      updateResume({
                        ...(activeVariant?.resume || cloneResume()),
                        showInHero: event.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>Show résumé link in hero</strong>
                    <small>
                      Adds a “View résumé” action that opens the PDF in an accessible modal.
                    </small>
                  </span>
                </label>
                <label className="resume-hero-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      activeVariant?.resume.hideSectionWhenHeroLink
                    )}
                    disabled={
                      !activeVariant?.resume.url ||
                      !activeVariant?.resume.showInHero
                    }
                    onChange={(event) =>
                      updateResume({
                        ...(activeVariant?.resume || cloneResume()),
                        hideSectionWhenHeroLink: event.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>
                      Hide standalone Resume section when hero link is shown
                    </strong>
                    <small>
                      Keeps the résumé available from the hero without repeating
                      the full Resume section lower on the page.
                    </small>
                  </span>
                </label>
              </EditorSection>

              <EditorSection
                title="Experience"
                subtitle={`${snapshot.data.experience.length} of ${state.data.experience.length} roles in this portfolio`}
                actionLabel="+ Add"
                onAction={() => setCreateDialog("experience")}
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
                subtitle={`${snapshot.data.projects.length} of ${state.data.projects.length} projects in this portfolio`}
                actionLabel="+ Add"
                onAction={() => setCreateDialog("project")}
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
                subtitle={`${snapshot.data.skills.length} of ${state.data.skills.length} skills in this portfolio`}
              >
                <Field
                  label="Skills"
                  multiline
                  value={state.data.skills.join(", ")}
                  onChange={updateSkills}
                  hint="Comma separated"
                />
              </EditorSection>

              <EditorSection
                title="Custom sections"
                subtitle={`${state.data.customSections.length} sections`}
                actionLabel="+ Add"
                onAction={() => setCreateDialog("custom-section")}
              >
                {state.data.customSections.length === 0 ? (
                  <p className="editor-empty-note">
                    Add Education, Certifications, Awards, Publications, Talks,
                    Open Source, Testimonials, or any section you need.
                  </p>
                ) : null}

                {state.data.customSections.map((customSection) => (
                  <EditorCard
                    key={customSection.id}
                    title={customSection.title || "Custom section"}
                    onDelete={() => removeCustomSection(customSection.id)}
                  >
                    <Field
                      label="Section title"
                      value={customSection.title}
                      onChange={(value) =>
                        renameCustomSection(customSection.id, value)
                      }
                    />

                    <div className="custom-editor-items-head">
                      <div>
                        <strong>Items</strong>
                        <span>{customSection.items.length} entries</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addCustomItem(customSection.id)}
                      >
                        + Item
                      </button>
                    </div>

                    {customSection.items.length === 0 ? (
                      <p className="editor-empty-note">
                        Add an item, then use only the fields that make sense for
                        this section.
                      </p>
                    ) : null}

                    <div className="custom-editor-items">
                      {customSection.items.map((item, itemIndex) => (
                        <div className="custom-editor-item" key={item.id}>
                          <div className="custom-editor-item-head">
                            <strong>
                              {item.heading || `Item ${itemIndex + 1}`}
                            </strong>
                            <button
                              type="button"
                              className="danger-link"
                              onClick={() =>
                                removeCustomItem(customSection.id, item.id)
                              }
                            >
                              Remove
                            </button>
                          </div>
                          <Field
                            label="Heading"
                            value={item.heading}
                            onChange={(value) =>
                              updateCustomItem(
                                customSection.id,
                                item.id,
                                "heading",
                                value
                              )
                            }
                          />
                          <Field
                            label="Subheading"
                            value={item.subheading}
                            onChange={(value) =>
                              updateCustomItem(
                                customSection.id,
                                item.id,
                                "subheading",
                                value
                              )
                            }
                          />
                          <Field
                            label="Period / meta"
                            value={item.meta}
                            onChange={(value) =>
                              updateCustomItem(
                                customSection.id,
                                item.id,
                                "meta",
                                value
                              )
                            }
                          />
                          <Field
                            label="Description"
                            multiline
                            value={item.description}
                            onChange={(value) =>
                              updateCustomItem(
                                customSection.id,
                                item.id,
                                "description",
                                value
                              )
                            }
                          />
                          <Field
                            label="Link label"
                            value={item.linkLabel}
                            onChange={(value) =>
                              updateCustomItem(
                                customSection.id,
                                item.id,
                                "linkLabel",
                                value
                              )
                            }
                          />
                          <Field
                            label="Link URL"
                            value={item.linkUrl}
                            onChange={(value) =>
                              updateCustomItem(
                                customSection.id,
                                item.id,
                                "linkUrl",
                                value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </EditorCard>
                ))}
              </EditorSection>

              <EditorSection
                title="Links"
                subtitle={`${state.data.profile.socials.length} links`}
                actionLabel="+ Add"
                onAction={() => setCreateDialog("link")}
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
          ) : (
            <div className="panel-body">
              <div className="panel-intro design-intro">
                <div>
                  <h2>Layout and theme</h2>
                  <p>
                    {visibleSections} sections are visible in {activeVariant?.name || "this portfolio"}.
                    Changing the design never changes your content.
                  </p>
                </div>
                <button className="shuffle-button" onClick={shuffleDesign}>
                  Shuffle design
                </button>
              </div>

              <section className="design-presets" aria-labelledby="design-presets-title">
                <h3 id="design-presets-title">Start with a complete design</h3>
                <p>Choose a coordinated layout, then adjust any section below.</p>
                <div className="design-preset-list">
                  {designPresets.map((preset) => (
                    <button key={preset.id} type="button" className={`design-preset preset-${preset.id}`}
                      aria-pressed={Boolean(activeVariant && matchesDesignPreset(activeVariant.config, preset))}
                      onClick={() => chooseDesignPreset(preset)}>
                      <span className="design-preset-preview" aria-hidden="true"><i /><i /><i /></span>
                      <strong>{preset.name}</strong><span>{preset.description}</span>
                    </button>
                  ))}
                </div>
              </section>

              <EditorSection
                title="Brand & sharing"
                subtitle="Favicon and link preview"
                defaultOpen
              >
                <ImageUploadField
                  label="Favicon"
                  value={activeVariant?.branding.faviconUrl || ""}
                  onChange={(value) => updateBranding("faviconUrl", value)}
                  uploadScope={{
                    scope: "portfolio",
                    variantKey: activeVariant?.id || state.activeVariantId,
                  }}
                  help="Optional. Use a square PNG or WebP; this icon appears in the browser tab for this portfolio."
                />
                <Field
                  label="Share title"
                  value={activeVariant?.branding.shareTitle || ""}
                  onChange={(value) => updateBranding("shareTitle", value)}
                  hint="Optional. Defaults to your name and target role."
                />
                <Field
                  label="Share description"
                  multiline
                  value={activeVariant?.branding.shareDescription || ""}
                  onChange={(value) => updateBranding("shareDescription", value)}
                  hint="Optional. Defaults to your portfolio tagline."
                />
                <ImageUploadField
                  label="Social share card"
                  value={activeVariant?.branding.shareImageUrl || ""}
                  onChange={(value) => updateBranding("shareImageUrl", value)}
                  uploadScope={{
                    scope: "portfolio",
                    variantKey: activeVariant?.id || state.activeVariantId,
                  }}
                  help="Optional. Recommended 1200 × 630. Leave blank to use an automatically generated card personalized to this portfolio."
                />
                <div className="sharing-preview-note">
                  <strong>Link preview</strong>
                  <span>
                    LinkedIn, X, Slack, WhatsApp and other apps will use these settings when this portfolio link is pasted.
                  </span>
                </div>
              </EditorSection>

              <div className="theme-picker">
                <label>Theme</label>
                <div className="theme-options">
                  {([
                    "ink",
                    "sand",
                    "moss",
                    "aurora",
                    "cobalt",
                    "rose",
                    "mono",
                    "sunset",
                    "ice",
                    "noir",
                  ] as ThemeName[]).map((theme) => (
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

              <section className="section-order-panel">
                <div className="section-order-heading">
                  <div>
                    <strong>Section order</strong>
                    <span>Move sections without opening each layout card.</span>
                  </div>
                  <small>{snapshot.config.sections.length} sections</small>
                </div>
                <div className="section-order-list">
                  {snapshot.config.sections.map((section, index) => {
                    const sectionLabel =
                      section.title?.trim() ||
                      (sectionType(section) === "custom"
                        ? state.data.customSections.find(
                            (item) => item.id === section.customSectionId
                          )?.title || "Custom section"
                        : section.id);

                    return (
                      <div className="section-order-row" key={`order-${section.id}`}>
                        <span className="section-order-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong>{sectionLabel}</strong>
                          <small>{section.visible ? "Visible" : "Hidden"}</small>
                        </div>
                        <div className="section-order-actions">
                          <button
                            type="button"
                            onClick={() => moveSection(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${sectionLabel} section up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 1)}
                            disabled={index === snapshot.config.sections.length - 1}
                            aria-label={`Move ${sectionLabel} section down`}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="section-config-list">
                {snapshot.config.sections.map((section, index) => (
                  <div className="section-config" key={section.id}>
                    <div className="section-config-head">
                      <div className="section-name-editor">
                        <label htmlFor={`section-name-${section.id}`}>Section name</label>
                        <input
                          id={`section-name-${section.id}`}
                          value={section.title || ""}
                          onChange={(event) =>
                            setSectionTitle(section.id, event.target.value)
                          }
                          aria-label={`Edit ${section.id} section name`}
                        />
                        <small>
                          {sectionType(section) === "custom"
                            ? state.data.customSections.find(
                                (item) => item.id === section.customSectionId
                              )?.title || "custom"
                            : section.id} · {section.visible ? section.variant : "hidden"}
                        </small>
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
                      <>
                        <div className="variant-grid">
                        {templateCatalog[sectionType(section)].map((variant) => (
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
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>
        </aside>

        <button
          type="button"
          className="builder-resizer"
          onPointerDown={startResize}
          onKeyDown={handleResizerKeyDown}
          onDoubleClick={resetEditorWidth}
          aria-label="Resize editor and preview panels"
          title="Drag to resize · arrows to adjust · double-click to reset"
        >
          <span />
        </button>

        <section className="preview-stage" ref={previewStageRef}>
          <div className="preview-toolbar">
            <div>
              <span>Live preview</span>
              <strong>{activeVariant?.name || "Untitled"}</strong>
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
              {snapshot.config.theme} theme · {visibleSections} sections ·{" "}
              {previewMode === "desktop"
                ? "responsive"
                : previewMode === "tablet"
                  ? "768 × 1024"
                  : "390 × 844"}
            </span>
          </div>

          <div className="preview-canvas">
          <div className={`preview-window preview-${previewMode}`}>
            <iframe
              ref={previewFrameRef}
              className="preview-device-frame"
              src="/builder/preview"
              title={`${previewMode} portfolio preview`}
              onLoad={sendPreviewPayload}
            />
            {visibleSections === 0 && (
              <div className="preview-empty" role="status">
                <strong>Your portfolio will appear here</strong>
                <p>
                  Add your name and role on the left, or import your résumé to
                  fill most of it in one step.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setTab("content");
                    setResumeImportOpen(true);
                  }}
                >
                  Import résumé
                </button>
              </div>
            )}
          </div>
          </div>
        </section>
      </div>

      <button
        type="button"
        className="mobile-preview-jump"
        onClick={() => {
          if (previewInView) window.scrollTo({ top: 0, behavior: "smooth" });
          else previewStageRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        {previewInView ? "↑ Edit" : "Preview ↓"}
      </button>

      {quickStartOpen ? (
        <QuickStartDialog
          onResume={() => {
            setQuickStartOpen(false);
            setResumeImportOpen(true);
          }}
          onGitHub={() => {
            setQuickStartOpen(false);
            setGitHubImportOpen(true);
          }}
          onManual={() => setQuickStartOpen(false)}
        />
      ) : null}

      {publishedUrl && activeVariant ? (
        <PublishedDialog
          url={publishedUrl}
          portfolioName={activeVariant.name || "Your portfolio"}
          variantKey={activeVariant.id}
          onClose={() => setPublishedUrl(null)}
        />
      ) : null}

      {createDialog && (
        <CreateItemDialog
          kind={createDialog}
          defaultTargetRole={activeVariant?.targetRole || state.data.profile.role}
          onClose={() => setCreateDialog(null)}
          onCreateExperience={(input) => {
            addExperience(input);
            setCreateDialog(null);
          }}
          onCreateProject={(input) => {
            addProject(input);
            setCreateDialog(null);
          }}
          onCreateLink={(input) => {
            addSocial(input);
            setCreateDialog(null);
          }}
          onCreateVariant={(input) => {
            createVariant(input);
            setCreateDialog(null);
          }}
          onCreateCustomSection={(title) => {
            createCustomSection(title);
            setCreateDialog(null);
          }}
        />
      )}

      {resumeImportOpen ? (
        <ResumeImportDialog
          onClose={() => setResumeImportOpen(false)}
          onApply={applyResumeImport}
        />
      ) : null}

      {githubImportOpen ? (
        <GitHubImportDialog
          initialUsername={initialGitHubUsername}
          existingGitHubUrls={existingGitHubUrls}
          onClose={() => setGitHubImportOpen(false)}
          onImport={importGitHubRepositories}
        />
      ) : null}

      {healthOpen ? (
        <PortfolioHealthDialog
          state={state}
          onClose={() => setHealthOpen(false)}
          onNavigate={(nextTab) => {
            setTab(nextTab);
            setHealthOpen(false);
          }}
        />
      ) : null}

      {jsonEditorOpen ? (
        <WorkspaceJsonDialog
          state={state}
          onClose={() => setJsonEditorOpen(false)}
          onApply={applyWorkspaceJson}
        />
      ) : null}
    </div>
  );
}
