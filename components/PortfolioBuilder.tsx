"use client";

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
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { ResumeImportDialog } from "@/components/ResumeImportDialog";
import { WorkspaceJsonDialog } from "@/components/WorkspaceJsonDialog";
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
}: {
  startFresh?: boolean;
  initialVariantId?: string;
  openCreateVariant?: boolean;
}) {
  const {
    state,
    setState,
    hydrated,
    shareUrl,
    setShareUrl,
    cloudUserId,
    cloudStatus,
    setCloudStatus,
    cloudMessage,
    setCloudMessage,
    cloudResolved,
    saveToCloud,
    publish,
    signOut,
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [resumeImportOpen, setResumeImportOpen] = useState(false);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const createVariantOpenedRef = useRef(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);





  useEffect(() => {
    if (!moreMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreMenuOpen]);


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
  const visibleSections = snapshot.config.sections.filter(
    (section) =>
      section.visible &&
      sectionHasContent(section, snapshot.data, snapshot.meta?.resume)
  ).length;

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
          deleteError instanceof Error ? deleteError.message : "Could not delete portfolio"
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
    setState(sampleBuilderState);
    setShareUrl("");
  }

  return (
    <div className="builder-shell">
      <header className="builder-topbar">
        <a className="brand" href="/">
          folio<span>blocks</span>
        </a>

        <div className="builder-topbar-controls">
          <div className="builder-status" title={cloudMessage || undefined} aria-live="polite">
            <span className={`save-dot cloud-${cloudStatus}`} />
            <span>
              {cloudUserId
                ? cloudStatus === "loading"
                  ? "Syncing…"
                  : cloudStatus === "error"
                    ? "Cloud error"
                    : cloudStatus === "saved"
                      ? "Saved"
                      : "Cloud ready"
                : "Local"}
            </span>
          </div>

          <div className="topbar-actions">
            {cloudUserId ? (
              <>
                <a className="topbar-link portfolio-manager-link" href="/portfolios">
                  Portfolios
                </a>
                <button
                  className="topbar-link"
                  onClick={saveToCloud}
                  disabled={cloudStatus === "loading"}
                >
                  Save
                </button>
              </>
            ) : (
              <a className="topbar-link cloud-login-link" href="/login">
                Sign in
              </a>
            )}

            <div className="topbar-more" ref={moreMenuRef}>
              <button
                type="button"
                className="topbar-more-trigger"
                aria-label="More builder actions"
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
                title="More actions"
                onClick={() => setMoreMenuOpen((open) => !open)}
              >
                <span aria-hidden="true">•••</span>
              </button>

              {moreMenuOpen ? (
                <div className="topbar-menu" role="menu">
                  {cloudUserId ? (
                    <>
                      <a
                        className="topbar-menu-mobile-action"
                        href="/portfolios"
                        role="menuitem"
                      >
                        Portfolios
                      </a>
                      <button
                        className="topbar-menu-mobile-action"
                        role="menuitem"
                        disabled={cloudStatus === "loading"}
                        onClick={() => {
                          setMoreMenuOpen(false);
                          void saveToCloud();
                        }}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <a
                      className="topbar-menu-mobile-action"
                      href="/login"
                      role="menuitem"
                    >
                      Sign in
                    </a>
                  )}

                  <button
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      startFreshWorkspace();
                    }}
                  >
                    Start fresh
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      loadDemo();
                    }}
                  >
                    Load demo
                  </button>
                  {cloudUserId ? (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        void signOut();
                      }}
                    >
                      Sign out
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              className="primary-button topbar-publish"
              onClick={publish}
              disabled={cloudStatus === "loading"}
              title={cloudUserId ? "Publish and copy public link" : undefined}
            >
              {cloudUserId ? "Publish" : "Sign in to publish"}
            </button>
          </div>
        </div>
      </header>

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
            <div className="variant-switcher">
            <div className="variant-switcher-head">
              <div>
                <span>Portfolio variants</span>
                <small>One profile, multiple presentations</small>
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
                    onClick={() => setJsonEditorOpen(true)}
                  >
                    Edit as JSON
                  </button>
                </div>
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
                  onChange={updateResume}
                />
              </EditorSection>

              <EditorSection
                title="Experience"
                subtitle={`${state.data.experience.length} roles`}
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

        <section className="preview-stage">
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
              {snapshot.config.theme} theme · {visibleSections} sections
            </span>
          </div>

          <div className={`preview-window preview-${previewMode}`}>
            <PortfolioRenderer snapshot={snapshot} compact />
          </div>
        </section>
      </div>

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

