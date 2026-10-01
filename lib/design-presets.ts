import type { PortfolioConfig, SectionType, ThemeName } from './portfolio';

export type DesignPreset = {
  id: string;
  name: string;
  description: string;
  theme: ThemeName;
  layouts: Partial<Record<SectionType, string>>;
};

export const designPresets: DesignPreset[] = [
  { id: 'studio', name: 'Studio', description: 'Portrait, visual projects, and a focused technology grid.', theme: 'cobalt', layouts: { hero: 'image-split', about: 'columns', experience: 'rail', projects: 'image-grid', skills: 'logos', resume: 'compact', contact: 'minimal' } },
  { id: 'editorial', name: 'Editorial', description: 'Warm typography, a personal story, and generous project previews.', theme: 'sand', layouts: { hero: 'editorial-photo', about: 'editorial', experience: 'stacked', projects: 'browser', skills: 'columns', resume: 'card', contact: 'split' } },
  { id: 'technical', name: 'Technical', description: 'A restrained résumé layout with repository-style project cards.', theme: 'mono', layouts: { hero: 'minimal', about: 'compact', experience: 'resume', projects: 'github', skills: 'logos', resume: 'compact', contact: 'minimal' } },
];

export function applyDesignPreset(config: PortfolioConfig, preset: DesignPreset): PortfolioConfig {
  return {
    ...config,
    theme: preset.theme,
    sections: config.sections.map(section => {
      const type = section.type || section.id as SectionType;
      const layout = preset.layouts[type];
      return layout ? { ...section, variant: layout } : { ...section };
    }),
  };
}

export function matchesDesignPreset(config: PortfolioConfig, preset: DesignPreset) {
  return config.theme === preset.theme && config.sections.every(section => {
    const layout = preset.layouts[section.type || section.id as SectionType];
    return !layout || section.variant === layout;
  });
}
