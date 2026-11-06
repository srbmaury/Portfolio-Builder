import type { BuilderState } from "@/lib/portfolio";
import { createContentActions } from "./actions/contentActions";
import { createDesignActions } from "./actions/designActions";
import { useTargetingActions } from "./actions/useTargetingActions";
import { createVariantActions } from "./actions/variantActions";
import type { SetBuilderState } from "./types";

export function usePortfolioEditorActions({
  state,
  setState,
  setShareUrl,
}: {
  state: BuilderState;
  setState: SetBuilderState;
  setShareUrl: (url: string) => void;
}) {
  const activeVariant =
    state.variants.find((variant) => variant.id === state.activeVariantId) ??
    state.variants[0];
  const targeting = useTargetingActions(state, activeVariant, setState);

  return {
    activeVariant,
    ...targeting,
    ...createContentActions(state, setState, setShareUrl),
    ...createDesignActions(setState),
    ...createVariantActions(state, activeVariant, setState, setShareUrl),
  };
}
