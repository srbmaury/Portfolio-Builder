import { useEffect, useRef } from "react";
import { sampleBuilderState, withFreshContentIds } from "@/lib/portfolio";
import type { PortfolioData } from "@/lib/portfolio";
import type { CreateDialogKind, SetBuilderState } from "./types";

export function useBuilderStartup({
  data,
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
}: {
  data: PortfolioData;
  hydrated: boolean;
  cloudResolved: boolean;
  openCreateVariant: boolean;
  startFresh: boolean;
  startWithDemo: boolean;
  quickStart: boolean;
  setCreateDialog: (kind: CreateDialogKind) => void;
  setQuickStartOpen: (open: boolean) => void;
  setState: SetBuilderState;
  setShareUrl: (url: string) => void;
}) {
  const { profile, experience, projects, skills, customSections } = data;
  const hasContent =
    Boolean(profile.name.trim() || profile.role.trim() || profile.tagline.trim()) ||
    experience.length > 0 ||
    projects.length > 0 ||
    skills.length > 0 ||
    customSections.length > 0;

  const createVariantOpenedRef = useRef(false);
  const demoLoadedRef = useRef(false);
  const quickStartShownRef = useRef(false);

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
  }, [cloudResolved, hydrated, openCreateVariant, setCreateDialog]);

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
    if (!hasContent) setQuickStartOpen(true);
  }, [
    cloudResolved,
    hydrated,
    openCreateVariant,
    quickStart,
    startFresh,
    startWithDemo,
    hasContent,
    setQuickStartOpen,
  ]);

  // The demo link only seeds empty workspaces, preserving existing drafts.
  useEffect(() => {
    if (!hydrated || !cloudResolved || !startWithDemo || demoLoadedRef.current) {
      return;
    }

    demoLoadedRef.current = true;

    if (!hasContent) {
      setState(withFreshContentIds(sampleBuilderState));
      setShareUrl("");
    }
  }, [cloudResolved, hydrated, startWithDemo, hasContent, setState, setShareUrl]);
}
