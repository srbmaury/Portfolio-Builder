import type {
  BuiltInSectionType,
  SectionType,
  PortfolioData,
  SectionConfig,
  PortfolioConfig,
  PortfolioBranding,
  PortfolioResume,
} from "./types.ts";

export const templateCatalog: Record<
  SectionType,
  Array<{ id: string; label: string; description: string }>
> = {
  hero: [
    { id: "split", label: "Split", description: "Big intro with profile panel" },
    { id: "minimal", label: "Minimal", description: "Editorial text-first hero" },
    { id: "terminal", label: "Terminal", description: "Developer-inspired command line" },
    { id: "poster", label: "Poster", description: "Oversized type with bold metadata" },
    { id: "spotlight", label: "Spotlight", description: "Centered luminous focal hero" },
    { id: "image-split", label: "Image Split", description: "Portrait and intro side by side" },
    { id: "cover", label: "Cover", description: "Full-bleed image with overlay copy" },
    { id: "portrait", label: "Portrait", description: "Editorial portrait card composition" },
    { id: "editorial-photo", label: "Photo Editorial", description: "Magazine typography with image" },
    { id: "glass", label: "Glass", description: "Image backdrop with glass information card" },
  ],
  about: [
    { id: "editorial", label: "Editorial", description: "Readable long-form story" },
    { id: "stats", label: "Snapshot", description: "Bio plus profile highlights" },
    { id: "manifesto", label: "Manifesto", description: "Big statement with profile notes" },
    { id: "quote", label: "Quote", description: "Statement-led personal introduction" },
    { id: "split", label: "Split", description: "Story and metadata side by side" },
    { id: "columns", label: "Columns", description: "Magazine-style two-column biography" },
    { id: "facts", label: "Facts", description: "Story paired with quick facts" },
    { id: "dossier", label: "Dossier", description: "Structured profile dossier" },
    { id: "statement", label: "Statement", description: "Oversized narrative statement" },
    { id: "compact", label: "Compact", description: "Dense recruiter-friendly summary" },
  ],
  experience: [
    { id: "timeline", label: "Timeline", description: "Chronological career path" },
    { id: "cards", label: "Cards", description: "Compact role cards" },
    { id: "stacked", label: "Stacked", description: "Full-width editorial role rows" },
    { id: "rail", label: "Rail", description: "Vertical rail with strong dates" },
    { id: "ledger", label: "Ledger", description: "Structured career ledger" },
    { id: "spotlight", label: "Spotlight", description: "Large feature card per role" },
    { id: "compact", label: "Compact", description: "Dense résumé-style entries" },
    { id: "alternating", label: "Alternating", description: "Alternating left-right career story" },
    { id: "resume", label: "Resume", description: "Classic polished résumé treatment" },
    { id: "steps", label: "Steps", description: "Numbered progression blocks" },
  ],
  projects: [
    { id: "bento", label: "Bento", description: "Feature-led project grid" },
    { id: "grid", label: "Grid", description: "Balanced project cards" },
    { id: "list", label: "List", description: "Dense recruiter-friendly list" },
    { id: "showcase", label: "Showcase", description: "Large numbered feature stories" },
    { id: "mosaic", label: "Mosaic", description: "Asymmetric magazine project wall" },
    { id: "image-grid", label: "Image Grid", description: "Visual cards with project screenshots" },
    { id: "image-bento", label: "Image Bento", description: "Image-first asymmetric showcase" },
    { id: "browser", label: "Browser", description: "Website previews inside browser frames" },
    { id: "github", label: "GitHub", description: "Repository-inspired project cards" },
    { id: "gallery", label: "Gallery", description: "Large visual project gallery" },
  ],
  skills: [
    { id: "cloud", label: "Cloud", description: "Scannable skill chips" },
    { id: "columns", label: "Columns", description: "Clean technical inventory" },
    { id: "matrix", label: "Matrix", description: "Bold capability tiles" },
    { id: "logos", label: "Logos", description: "Brand logos with skill labels" },
    { id: "logo-grid", label: "Logo Grid", description: "Large icon-forward technology grid" },
    { id: "ticker", label: "Ticker", description: "Continuous-looking skill rail" },
    { id: "badges", label: "Badges", description: "Compact credential-like badges" },
    { id: "cards", label: "Cards", description: "Individual capability cards" },
    { id: "compact", label: "Compact", description: "Dense inline technology list" },
    { id: "spotlight", label: "Spotlight", description: "Oversized highlighted skill names" },
  ],
  resume: [
    { id: "embed", label: "Embedded", description: "Show the PDF directly in the portfolio" },
    { id: "card", label: "Card", description: "Compact resume card with an open action" },
    { id: "compact", label: "Compact", description: "Dense one-line résumé action" },
    { id: "split", label: "Split", description: "Editorial statement with document action" },
    { id: "spotlight", label: "Spotlight", description: "Large accent-led résumé callout" },
    { id: "minimal", label: "Minimal", description: "Quiet text-first résumé link" },
    { id: "terminal", label: "Terminal", description: "Developer command-style résumé block" },
  ],
  contact: [
    { id: "panel", label: "Panel", description: "Strong final call to action" },
    { id: "minimal", label: "Minimal", description: "Simple contact footer" },
    { id: "banner", label: "Banner", description: "High-impact closing statement" },
    { id: "split", label: "Split", description: "CTA and contact details side by side" },
    { id: "card", label: "Card", description: "Contained contact card" },
    { id: "centered", label: "Centered", description: "Focused centered invitation" },
    { id: "terminal", label: "Terminal", description: "Developer command-style ending" },
    { id: "outline", label: "Outline", description: "Large outlined CTA treatment" },
    { id: "compact", label: "Compact", description: "Small practical contact footer" },
    { id: "spotlight", label: "Spotlight", description: "Luminous full-width closing CTA" },
  ],
  custom: [
    { id: "list", label: "List", description: "Dense rows for structured details" },
    { id: "cards", label: "Cards", description: "Responsive cards for flexible content" },
    { id: "timeline", label: "Timeline", description: "Meta-led vertical timeline" },
    { id: "grid", label: "Grid", description: "Balanced two-column content grid" },
    { id: "compact", label: "Compact", description: "Dense recruiter-friendly rows" },
    { id: "split", label: "Split", description: "Alternating editorial split layout" },
    { id: "spotlight", label: "Spotlight", description: "Feature the first item prominently" },
    { id: "badges", label: "Badges", description: "Compact credential-style pills" },
  ],
};

export const defaultBranding: PortfolioBranding = {
  faviconUrl: "",
  shareTitle: "",
  shareDescription: "",
  shareImageUrl: "",
};

export const defaultResume: PortfolioResume = {
  url: "",
  publicId: "",
  fileName: "",
  showInHero: false,
  hideSectionWhenHeroLink: false,
};

export function cloneResume(
  resume: PortfolioResume = defaultResume
): PortfolioResume {
  return { ...resume };
}

export function cloneBranding(
  branding: PortfolioBranding = defaultBranding
): PortfolioBranding {
  return { ...branding };
}

export const defaultConfig: PortfolioConfig = {
  theme: "ink",
  sections: [
    { id: "hero", type: "hero", variant: "split", visible: true, title: "Portfolio" },
    { id: "about", type: "about", variant: "editorial", visible: true, title: "About" },
    { id: "experience", type: "experience", variant: "timeline", visible: true, title: "Experience" },
    { id: "projects", type: "projects", variant: "bento", visible: true, title: "Selected work" },
    { id: "skills", type: "skills", variant: "cloud", visible: true, title: "Capabilities" },
    { id: "resume", type: "resume", variant: "embed", visible: true, title: "Resume" },
    { id: "contact", type: "contact", variant: "panel", visible: true, title: "Contact" },
  ],
};

export function sectionType(section?: SectionConfig | null): SectionType {
  if (!section) return "custom";
  if (section.type) return section.type;

  const builtIns: BuiltInSectionType[] = [
    "hero",
    "about",
    "experience",
    "projects",
    "skills",
    "resume",
    "contact",
  ];
  return builtIns.includes(section.id as BuiltInSectionType)
    ? (section.id as BuiltInSectionType)
    : "custom";
}

export function sectionDisplayTitle(
  id: SectionType,
  value?: string
) {
  const fallback =
    defaultConfig.sections.find((section) => sectionType(section) === id)?.title ||
    (id === "custom"
      ? "Custom section"
      : id.charAt(0).toUpperCase() + id.slice(1));

  return value?.trim() || fallback;
}

export function cloneConfig(config: PortfolioConfig): PortfolioConfig {
  return {
    theme: config.theme,
    sections: config.sections.map((section) => ({ ...section })),
  };
}

export function sectionHasContent(
  section: SectionConfig | SectionType | undefined,
  data: PortfolioData,
  resume: PortfolioResume = defaultResume
) {
  if (!section) return false;

  const config =
    typeof section === "string"
      ? ({ id: section, type: section } as SectionConfig)
      : section;
  const type = sectionType(config);
  const profile = data.profile;

  switch (type) {
    case "hero":
      return Boolean(
        profile.name.trim() ||
          profile.role.trim() ||
          profile.tagline.trim() ||
          profile.location.trim() ||
          profile.availability.trim() ||
          profile.email.trim() ||
          profile.heroImageUrl?.trim() ||
          profile.socials.some(
            (social) => social.label.trim() || social.url.trim()
          )
      );
    case "about":
      return Boolean(profile.about.trim());
    case "experience":
      return data.experience.length > 0;
    case "projects":
      return data.projects.length > 0;
    case "skills":
      return data.skills.length > 0;
    case "resume":
      return Boolean(
        resume.url.trim() &&
          !(resume.showInHero && resume.hideSectionWhenHeroLink)
      );
    case "contact":
      return Boolean(
        profile.email.trim() ||
          profile.availability.trim() ||
          profile.socials.some(
            (social) => social.label.trim() || social.url.trim()
          )
      );
    case "custom": {
      const custom = data.customSections.find(
        (item) => item.id === config.customSectionId
      );
      return Boolean(
        custom?.items.some((item) =>
          [
            item.heading,
            item.subheading,
            item.meta,
            item.description,
            item.linkLabel,
            item.linkUrl,
          ].some((value) => value.trim())
        )
      );
    }
  }
}
