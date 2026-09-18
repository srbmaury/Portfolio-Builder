import {
  normalizeBuilderState,
  type BuilderState,
} from "@/lib/portfolio";

export type WorkspaceJsonResult =
  | { ok: true; state: BuilderState }
  | { ok: false; error: string };

export type FormatJsonResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export function parseWorkspaceJson(text: string): WorkspaceJsonResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "Enter valid JSON before applying workspace changes.",
    };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: "Workspace JSON must be an object." };
  }

  if (!isObject(parsed.data) || !isObject(parsed.data.profile)) {
    return {
      ok: false,
      error: "Workspace JSON must include data.profile.",
    };
  }

  if (!Array.isArray(parsed.variants)) {
    return {
      ok: false,
      error: "Workspace JSON must include a variants array.",
    };
  }

  if (
    parsed.activeVariantId !== undefined &&
    typeof parsed.activeVariantId !== "string"
  ) {
    return {
      ok: false,
      error: "Workspace activeVariantId must be a string.",
    };
  }

  try {
    return {
      ok: true,
      state: normalizeBuilderState(parsed as unknown as BuilderState),
    };
  } catch {
    return {
      ok: false,
      error: "Workspace JSON has an unsupported data shape.",
    };
  }
}

export function formatWorkspaceJson(text: string): FormatJsonResult {
  try {
    return {
      ok: true,
      text: JSON.stringify(JSON.parse(text), null, 2),
    };
  } catch {
    return {
      ok: false,
      error: "Enter valid JSON before formatting.",
    };
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
