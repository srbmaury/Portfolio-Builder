"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const EDITOR_WIDTH_KEY = "folioblocks:editor-width";
const MIN_EDITOR_WIDTH = 320;
const DEFAULT_EDITOR_WIDTH = 420;
const MAX_EDITOR_WIDTH = 720;

function maxEditorWidth() {
  if (typeof window === "undefined") return DEFAULT_EDITOR_WIDTH;
  return Math.max(
    MIN_EDITOR_WIDTH,
    Math.min(MAX_EDITOR_WIDTH, window.innerWidth - 460)
  );
}

export function useEditorResize() {
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH);

  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem(EDITOR_WIDTH_KEY));
    if (Number.isFinite(savedWidth) && savedWidth >= MIN_EDITOR_WIDTH) {
      setEditorWidth(Math.min(savedWidth, maxEditorWidth()));
    }

    function clampEditorWidth() {
      if (window.innerWidth <= 760) return;
      setEditorWidth((current) => Math.min(current, maxEditorWidth()));
    }

    window.addEventListener("resize", clampEditorWidth);
    return () => window.removeEventListener("resize", clampEditorWidth);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(EDITOR_WIDTH_KEY, String(editorWidth));
  }, [editorWidth]);

  function resetEditorWidth() {
    setEditorWidth(Math.min(DEFAULT_EDITOR_WIDTH, maxEditorWidth()));
  }

  function nudgeEditorWidth(delta: number) {
    setEditorWidth((current) =>
      Math.max(
        MIN_EDITOR_WIDTH,
        Math.min(maxEditorWidth(), current + delta)
      )
    );
  }

  function handleResizerKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeEditorWidth(-24);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeEditorWidth(24);
    } else if (event.key === "Home") {
      event.preventDefault();
      setEditorWidth(MIN_EDITOR_WIDTH);
    } else if (event.key === "End") {
      event.preventDefault();
      setEditorWidth(maxEditorWidth());
    }
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (window.innerWidth <= 760) return;

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = editorWidth;
    document.body.classList.add("builder-resizing");

    function onPointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(
        MIN_EDITOR_WIDTH,
        Math.min(
          maxEditorWidth(),
          startWidth + moveEvent.clientX - startX
        )
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

  return {
    editorWidth,
    startResize,
    handleResizerKeyDown,
    resetEditorWidth,
  };
}
