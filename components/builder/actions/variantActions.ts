import { trackProductEvent } from "@/lib/product-analytics";
import {
  cloneBranding,
  cloneConfig,
  cloneContentConfig,
  cloneResume,
  defaultConfig,
  fullContentConfig,
  slugify,
  cloneData,
} from "@/lib/portfolio";
import type { BuilderState, PortfolioVariant } from "@/lib/portfolio";
import type { SetBuilderState } from "../types";

export function createVariantActions(
  state: BuilderState,
  activeVariant: PortfolioVariant | undefined,
  setState: SetBuilderState,
  setShareUrl: (url: string) => void
) {
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
          data: cloneData(activeVariant?.data ?? current.data),
          config: cloneConfig(currentConfig),
          content: cloneContentConfig(
            activeVariant?.content ?? fullContentConfig(current.data)
          ),
          branding: cloneBranding(activeVariant?.branding),
          resume: cloneResume(activeVariant?.resume),
        },
      ],
    }));

    trackProductEvent("portfolio_created", id);
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
          data: cloneData(activeVariant.data),
          config: cloneConfig(activeVariant.config),
          content: cloneContentConfig(activeVariant.content),
          branding: cloneBranding(activeVariant.branding),
          resume: cloneResume(activeVariant.resume),
        },
      ],
    }));

    trackProductEvent("portfolio_created", id);
    setShareUrl("");
  }

  function updateVariantMeta(
    field: "name" | "targetRole",
    value: string
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, [field]: value }
          : variant
      ),
    }));
  }

  return {
    createVariant,
    duplicateVariant,
    updateVariantMeta,
  };
}
