import { applyDesignPreset, type DesignPreset } from "@/lib/design-presets";
import { sectionType, templateCatalog } from "@/lib/portfolio";
import type { PortfolioConfig, ThemeName } from "@/lib/portfolio";
import type { SetBuilderState } from "../types";

export function createDesignActions(setState: SetBuilderState) {
  function updateActiveConfig(
    updater: (config: PortfolioConfig) => PortfolioConfig
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? { ...variant, config: updater(variant.config) }
          : variant
      ),
    }));
  }

  function chooseDesignPreset(preset: DesignPreset) {
    updateActiveConfig((config) => applyDesignPreset(config, preset));
  }

  function updateTheme(theme: ThemeName) {
    updateActiveConfig((config) => ({ ...config, theme }));
  }

  function updateBranding(
    field: "faviconUrl" | "shareTitle" | "shareDescription" | "shareImageUrl",
    value: string
  ) {
    setState((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? {
              ...variant,
              branding: { ...variant.branding, [field]: value },
            }
          : variant
      ),
    }));
  }

  function setVariant(configId: string, variantName: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === configId
          ? { ...section, variant: variantName }
          : section
      ),
    }));
  }

  function setSectionTitle(configId: string, title: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === configId ? { ...section, title } : section
      ),
    }));
  }

  function toggleSection(configId: string) {
    updateActiveConfig((config) => ({
      ...config,
      sections: config.sections.map((section) =>
        section.id === configId
          ? { ...section, visible: !section.visible }
          : section
      ),
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    updateActiveConfig((config) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= config.sections.length) return config;

      const sections = [...config.sections];
      [sections[index], sections[nextIndex]] = [
        sections[nextIndex],
        sections[index],
      ];
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
        const options = templateCatalog[sectionType(section)];
        return {
          ...section,
          variant: options[Math.floor(Math.random() * options.length)].id,
        };
      }),
    }));
  }

  return {
    updateTheme,
    chooseDesignPreset,
    updateBranding,
    setVariant,
    setSectionTitle,
    toggleSection,
    moveSection,
    shuffleDesign,
  };
}
