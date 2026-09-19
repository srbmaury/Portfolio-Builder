"use client";

import { useEffect, useState } from "react";
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

export function useBuilderWorkspace({
  startFresh,
  initialVariantId,
}: {
  startFresh: boolean;
  initialVariantId?: string;
}) {
  const [state, setState] = useState<BuilderState>(emptyBuilderState);
  const [hydrated, setHydrated] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudResolved, setCloudResolved] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

    if (!startFresh && saved) {
      try {
        const localState = normalizeBuilderState(
          JSON.parse(saved) as BuilderState
        );
        setState(
          initialVariantId &&
            localState.variants.some(
              (variant) => variant.id === initialVariantId
            )
            ? { ...localState, activeVariantId: initialVariantId }
            : localState
        );
      } catch {
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    } else if (startFresh) {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      setState(emptyBuilderState);
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
          setState(
            initialVariantId &&
              remote.variants.some(
                (variant) => variant.id === initialVariantId
              )
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
      setCloudUserId(data.user.id);
      setCloudStatus("saved");
      setCloudMessage("Saved to cloud");
      trackProductEvent("workspace_saved", state.activeVariantId);
    } catch (saveError) {
      setCloudStatus("error");
      setCloudMessage(
        saveError instanceof Error ? saveError.message : "Cloud save failed"
      );
    }
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
      trackProductEvent("portfolio_published", state.activeVariantId);

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

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCloudUserId(null);
    setCloudStatus("local");
    setCloudMessage("Signed out · local draft preserved");
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
    saveToCloud,
    publish,
    signOut,
  };
}
