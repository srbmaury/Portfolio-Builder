"use client";

import { errorMessage } from "@/lib/error-message";
import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { trackProductEvent } from "@/lib/product-analytics";
import {
  emptyBuilderState,
  normalizeBuilderState,
  type BuilderState,
} from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/client";
import {
  loadBuilderState,
  publishVariant,
  saveBuilderState,
} from "@/lib/supabase/portfolio-store";

export const WORKSPACE_STORAGE_KEY = "folioblocks:workspace";
const LOCAL_DRAFT_DELAY_MS = 200;

type CloudStatus = "local" | "loading" | "saved" | "error";

function workspaceContentSignature(state: BuilderState) {
  // activeVariantId is navigation state, not an edit. Every content/config
  // change is mirrored into variants, so this signature only changes for data
  // that actually needs to be saved.
  return JSON.stringify(state.variants);
}

export function useBuilderWorkspace({
  startFresh,
  initialVariantId,
}: {
  startFresh: boolean;
  initialVariantId?: string;
}) {
  const [state, setStateInternal] = useState<BuilderState>(emptyBuilderState);

  /**
   * state.data is the open portfolio's own content. Mirror any edit onto that
   * variant so it stays with the portfolio, and swap the working copy when a
   * different portfolio is opened. Every caller goes through this, so no code
   * path can quietly put the portfolios back on a shared pool.
   */
  const setState = useCallback<Dispatch<SetStateAction<BuilderState>>>(
    (action) => {
      setStateInternal((current) => {
        const next =
          typeof action === "function"
            ? (action as (value: BuilderState) => BuilderState)(current)
            : action;

        if (next.activeVariantId !== current.activeVariantId) {
          const opened = next.variants.find(
            (variant) => variant.id === next.activeVariantId
          );
          return opened ? { ...next, data: opened.data } : next;
        }

        if (next.data === current.data) return next;

        return {
          ...next,
          variants: next.variants.map((variant) =>
            variant.id === next.activeVariantId
              ? { ...variant, data: next.data }
              : variant
          ),
        };
      });
    },
    []
  );
  const [hydrated, setHydrated] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudResolved, setCloudResolved] = useState(false);
  const [lastSavedSignature, setLastSavedSignature] = useState<string | null>(null);
  // Set when a portfolio was asked for by id but no longer exists. Without
  // this the builder silently opened whichever portfolio was edited last,
  // which reads as Edit loading the wrong portfolio's details.
  const [requestedVariantMissing, setRequestedVariantMissing] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

    if (!startFresh && saved) {
      try {
        const localState = normalizeBuilderState(
          JSON.parse(saved) as BuilderState
        );
        const requestedExists =
          !initialVariantId ||
          localState.variants.some(
            (variant) => variant.id === initialVariantId
          );

        setStateInternal(
          initialVariantId && requestedExists
            ? { ...localState, activeVariantId: initialVariantId }
            : localState
        );
        setRequestedVariantMissing(!requestedExists);
      } catch {
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    } else if (startFresh) {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      setStateInternal(emptyBuilderState);
    }

    setHydrated(true);
  }, [initialVariantId, startFresh]);

  useEffect(() => {
    if (!hydrated) return;

    const persist = () => {
      try {
        window.localStorage.setItem(
          WORKSPACE_STORAGE_KEY,
          JSON.stringify(state)
        );
      } catch {
        // A full/blocked storage area should not interrupt editing.
      }
    };

    const timeout = window.setTimeout(persist, LOCAL_DRAFT_DELAY_MS);
    window.addEventListener("pagehide", persist);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pagehide", persist);
    };
  }, [hydrated, state]);

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
          const requestedExists =
            !initialVariantId ||
            remote.variants.some((variant) => variant.id === initialVariantId);

          setStateInternal(
            initialVariantId && requestedExists
              ? { ...remote, activeVariantId: initialVariantId }
              : remote
          );
          setRequestedVariantMissing(!requestedExists);
          setCloudMessage(
            requestedExists
              ? "Loaded from cloud"
              : "That portfolio no longer exists. Showing your most recent one."
          );
          setLastSavedSignature(workspaceContentSignature(remote));
          setCloudStatus("saved");
        } else {
          setLastSavedSignature(null);
          setCloudMessage("Signed in · local draft not saved yet");
          setCloudStatus("local");
        }
      } catch (loadError) {
        if (cancelled) return;
        setCloudMessage(
          loadError instanceof Error
            ? loadError.message
            : "Could not load cloud workspace"
        );
        setCloudStatus("error");
      } finally {
        if (!cancelled) setCloudResolved(true);
      }
    }

    void loadCloudWorkspace();
    return () => {
      cancelled = true;
    };
  }, [hydrated, initialVariantId, startFresh]);

  useEffect(() => {
    if (!cloudResolved || !cloudUserId) return;

    const key = `folioblocks:product:builder-opened:${cloudUserId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Best-effort product analytics only.
    }

    trackProductEvent("builder_opened");
  }, [cloudResolved, cloudUserId]);

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
      setLastSavedSignature(workspaceContentSignature(state));
      setCloudUserId(data.user.id);
      setCloudStatus("saved");
      setCloudMessage("Saved to cloud");
      trackProductEvent("workspace_saved", state.activeVariantId);
    } catch (saveError) {
      setCloudStatus("error");
      setCloudMessage(
        errorMessage(saveError, "Cloud save failed")
      );
    }
  }

  const hasUnsavedChanges =
    Boolean(cloudUserId) && workspaceContentSignature(state) !== lastSavedSignature;

  /** Returns the public URL on success, or null. */
  async function publish(): Promise<string | null> {
    if (hasUnsavedChanges) {
      setCloudMessage("Save changes before publishing");
      return null;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return null;
    }

    setCloudStatus("loading");
    setCloudMessage("Publishing…");

    try {
      const publicPath = await publishVariant(supabase, data.user, state);
      const url = `${window.location.origin}/${publicPath}`;

      setShareUrl(url);
      setCloudUserId(data.user.id);
      setCloudStatus("saved");
      setCloudMessage("Published from cloud");
      trackProductEvent("portfolio_published", state.activeVariantId);

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard can be blocked in some preview environments.
      }
      return url;
    } catch (publishError) {
      setCloudStatus("error");
      setCloudMessage(
        errorMessage(publishError, "Publish failed")
      );
      return null;
    }
  }

  return {
    state,
    setState,
    hydrated,
    shareUrl,
    setShareUrl,
    cloudUserId,
    setCloudUserId,
    cloudStatus,
    setCloudStatus,
    cloudMessage,
    setCloudMessage,
    cloudResolved,
    requestedVariantMissing,
    hasUnsavedChanges,
    saveToCloud,
    publish,
  };
}
