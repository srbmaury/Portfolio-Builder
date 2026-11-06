import type { Dispatch, SetStateAction } from "react";
import type { BuilderState } from "@/lib/portfolio";

export type SetBuilderState = Dispatch<SetStateAction<BuilderState>>;

export type PreviewMode = "desktop" | "tablet" | "mobile";

export type CreateDialogKind =
  | "experience"
  | "project"
  | "link"
  | "variant"
  | "custom-section"
  | null;
