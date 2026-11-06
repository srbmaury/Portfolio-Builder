"use client";

import { errorMessage } from "@/lib/error-message";
import { PublishedDialog } from "@/components/PublishedDialog";
import { QuickStartDialog } from "@/components/QuickStartDialog";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { CreateDialogKind } from "@/components/builder/types";
import { useEditorResize } from "@/components/builder/useEditorResize";
import { usePortfolioEditorActions } from "@/components/builder/usePortfolioEditorActions";
import { CreateItemDialog } from "@/components/builder/CreateItemDialog";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { PortfolioSwitcher } from "@/components/builder/PortfolioSwitcher";
import { useBuilderStartup } from "@/components/builder/useBuilderStartup";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { ContentPanel } from "@/components/builder/ContentPanel";
import { TargetingPanel } from "@/components/builder/TargetingPanel";
import { DesignPanel } from "@/components/builder/DesignPanel";
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
  emptyBuilderState,
  normalizeBuilderState,
  sampleBuilderState,
  withFreshContentIds,
  sectionHasContent,
  snapshotForVariant,
  type BuilderState,
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

  useBuilderStartup({
    data: state.data,
    hydrated,
    cloudResolved,
    openCreateVariant,
    startFresh,
    startWithDemo,
    quickStart,
    setCreateDialog,
    setQuickStartOpen,
    setState,
    setShareUrl,
  });

  const editorActions = usePortfolioEditorActions({
    state,
    setState,
    setShareUrl,
  });
  const {
    activeVariant,
    addExperience,
    addProject,
    addSocial,
    createCustomSection,
    createVariant,
    duplicateVariant,
    updateVariantMeta,
  } = editorActions;

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
      <BuilderTopBar
        accountEmail={accountEmail}
        isAdmin={isAdmin}
        cloudUserId={cloudUserId}
        cloudStatus={cloudStatus}
        cloudMessage={cloudMessage}
        hasUnsavedChanges={hasUnsavedChanges}
        saveToCloud={saveToCloud}
        onHealth={() => setHealthOpen(true)}
        onPublish={async () => {
          const url = await publish();
          if (url) setPublishedUrl(url);
        }}
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
            <PortfolioSwitcher
              variants={state.variants}
              activeVariantId={state.activeVariantId}
              activeVariant={activeVariant}
              onSelect={(id) => {
                setState((current) => ({ ...current, activeVariantId: id }));
                setShareUrl("");
              }}
              onCreate={() => setCreateDialog("variant")}
              onRename={(value) => updateVariantMeta("name", value)}
              onDuplicate={duplicateVariant}
              onDelete={removeActiveVariant}
            />
            {tab === "content" ? (
              <ContentPanel
                state={state}
                snapshot={snapshot}
                actions={editorActions}
                builderResumeUrl={builderResumeUrl}
                setCreateDialog={setCreateDialog}
                onResumeImport={() => setResumeImportOpen(true)}
                onGitHubImport={() => setGitHubImportOpen(true)}
                onEditJson={() => setJsonEditorOpen(true)}
                loadDemo={loadDemo}
                startFreshWorkspace={startFreshWorkspace}
              />
            ) : tab === "targeting" ? (
              <TargetingPanel state={state} actions={editorActions} />
            ) : (
              <DesignPanel
                state={state}
                snapshot={snapshot}
                visibleSections={visibleSections}
                actions={editorActions}
              />
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

        <BuilderPreview
          snapshot={snapshot}
          portfolioName={activeVariant?.name}
          builderResumeUrl={builderResumeUrl}
          visibleSections={visibleSections}
          previewStageRef={previewStageRef}
          onResumeImport={() => {
            setTab("content");
            setResumeImportOpen(true);
          }}
        />
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
