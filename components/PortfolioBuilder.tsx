"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/client";
import {
  deletePortfolio,
  loadBuilderState,
  publishVariant,
  saveBuilderState,
} from "@/lib/supabase/portfolio-store";
import {
  cloneConfig,
  cloneContentConfig,
  createEntityId,
  defaultConfig,
  emptyBuilderState,
  fullContentConfig,
  normalizeBuilderState,
  sampleBuilderState,
  sectionHasContent,
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
type CreateDialogKind = "experience" | "project" | "link" | "variant" | null;

export function PortfolioBuilder({
  startFresh = false,
  initialVariantId,
  openCreateVariant = false,
}: {
  startFresh?: boolean;
  initialVariantId?: string;
  openCreateVariant?: boolean;
}) {
  const [state, setState] = useState<BuilderState>(emptyBuilderState);
  const [tab, setTab] = useState<"content" | "targeting" | "design">("content");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [hydrated, setHydrated] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"local" | "loading" | "saved" | "error">("local");
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudResolved, setCloudResolved] = useState(false);
  const [editorWidth, setEditorWidth] = useState(420);
  const [createDialog, setCreateDialog] = useState<CreateDialogKind>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const createVariantOpenedRef = useRef(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const savedWidth = Number(window.localStorage.getItem(EDITOR_WIDTH_KEY));

    if (!startFresh && saved) {
      try {
        const localState = normalizeBuilderState(JSON.parse(saved) as BuilderState);
        setState(
          initialVariantId &&
            localState.variants.some((variant) => variant.id === initialVariantId)
            ? { ...localState, activeVariantId: initialVariantId }
            : localState
        );
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } else if (startFresh) {
      window.localStorage.removeItem(STORAGE_KEY);
      setState(emptyBuilderState);
    }

    if (Number.isFinite(savedWidth) && savedWidth >= 320) {
      const maxWidth = Math.max(320, Math.min(720, window.innerWidth - 460));
      setEditorWidth(Math.min(savedWidth, maxWidth));
    }

    setHydrated(true);
  }, [initialVariantId, startFresh]);

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
    function clampEditorWidth() {
      if (window.innerWidth <= 760) return;
      const maxWidth = Math.max(320, Math.min(720, window.innerWidth - 460));
      setEditorWidth((current) => Math.min(current, maxWidth));
    }

    window.addEventListener("resize", clampEditorWidth);
    return () => window.removeEventListener("resize", clampEditorWidth);
  }, []);

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
    if (!hydrated) return;

    let cancelled = false;

    async function loadCloudWorkspace() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !data.user) {
        setCloudUserId(null);
        setCloudStatus("local");
        setCloudResolved(true);
        return;
      }

      setCloudUserId(data.user.id);

      if (startFresh) {
        setCloudStatus("local");
        setCloudMessage("Fresh workspace · not saved yet");
        setCloudResolved(true);
        return;
      }

      setCloudStatus("loading");

      try {
        const remote = await loadBuilderState(supabase, data.user);
        if (cancelled) return;

        if (remote) {
          setState(
            initialVariantId &&
              remote.variants.some((variant) => variant.id === initialVariantId)
              ? { ...remote, activeVariantId: initialVariantId }
              : remote
          );
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
      } finally {
        if (!cancelled) setCloudResolved(true);
      }
    }

    loadCloudWorkspace();

    return () => {
      cancelled = true;
    };
  }, [hydrated, initialVariantId, startFresh]);

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

  const activeVariant =
    state.variants.find((variant) => variant.id === state.activeVariantId) ??
    state.variants[0];

  const snapshot = useMemo(() => snapshotForVariant(state), [state]);
  const visibleSections = snapshot.config.sections.filter(
    (section) => section.visible && sectionHasContent(section.id, snapshot.data)
  ).length;

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
    field:
      | "name"
      | "role"
      | "tagline"
      | "about"
      | "email"
      | "location"
      | "availability"
      | "heroImageUrl",
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

  function setSectionTitle(id: SectionType, title: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === id ? { ...section, title } : section
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
    const themes: ThemeName[] = [
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
    ];
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

  function addExperience(input: {
    company: string;
    role: string;
    period: string;
    summary: string;
  }) {
    const id = createEntityId("experience");
    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        experience: [...current.data.experience, { id, ...input }],
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
    field: "title" | "description" | "imageUrl" | "githubUrl" | "liveUrl",
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

  function addProject(input: {
    title: string;
    description: string;
    stack: string[];
    imageUrl?: string;
    githubUrl?: string;
    liveUrl?: string;
  }) {
    const id = createEntityId("project");
    setState((current) => ({
      ...current,
      data: {
        ...current.data,
        projects: [...current.data.projects, { id, ...input }],
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

  function addSocial(input: { label: string; url: string }) {
    updateData((data) => ({
      ...data,
      profile: {
        ...data.profile,
        socials: [...data.profile.socials, input],
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

  function createVariant(input: { name: string; targetRole: string }) {
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
          name: input.name,
          targetRole: input.targetRole,
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

  async function removeActiveVariant() {
    if (state.variants.length <= 1 || !activeVariant) return;

    if (
      !window.confirm(
        `Delete “${activeVariant.name || "Untitled"}”? This removes the saved portfolio and its published page.`
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

  function getMaxEditorWidth() {
    return Math.max(320, Math.min(720, window.innerWidth - 460));
  }

  function resetEditorWidth() {
    setEditorWidth(Math.min(420, getMaxEditorWidth()));
  }

  function nudgeEditorWidth(delta: number) {
    const maxWidth = getMaxEditorWidth();
    setEditorWidth((current) => Math.max(320, Math.min(maxWidth, current + delta)));
  }

  function handleResizerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeEditorWidth(-24);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeEditorWidth(24);
    }

    if (event.key === "Home") {
      event.preventDefault();
      setEditorWidth(320);
    }

    if (event.key === "End") {
      event.preventDefault();
      setEditorWidth(getMaxEditorWidth());
    }
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
      const url = `${window.location.origin}/${publicPath}`;

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
    window.localStorage.removeItem(STORAGE_KEY);
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
          <div className="builder-status" title={cloudMessage || undefined}>
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
                          {section.id} · {section.visible ? section.variant : "hidden"}
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
        />
      )}
    </div>
  );
}

function CreateItemDialog({
  kind,
  defaultTargetRole,
  onClose,
  onCreateExperience,
  onCreateProject,
  onCreateLink,
  onCreateVariant,
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
          : "Create portfolio variant";

  const submitLabel =
    kind === "experience"
      ? "Add experience"
      : kind === "project"
        ? "Add project"
        : kind === "link"
          ? "Add link"
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

function ImageUploadField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
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
      const result = await uploadImageToCloudinary(file);
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
