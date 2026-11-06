export type BuiltInSectionType =
  | "hero"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "resume"
  | "contact";

export type SectionType = BuiltInSectionType | "custom";

export type ThemeName =
  | "ink"
  | "sand"
  | "moss"
  | "aurora"
  | "cobalt"
  | "rose"
  | "mono"
  | "sunset"
  | "ice"
  | "noir";

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  about: string;
  email: string;
  location: string;
  availability: string;
  heroImageUrl?: string;
  socials: Array<{ label: string; url: string }>;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  period: string;
  summary: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  stack: string[];
  imageUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
};

export type CustomSectionItem = {
  id: string;
  heading: string;
  subheading: string;
  meta: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
};

export type CustomSection = {
  id: string;
  title: string;
  items: CustomSectionItem[];
};

export type PortfolioData = {
  profile: Profile;
  experience: Experience[];
  projects: Project[];
  skills: string[];
  customSections: CustomSection[];
};

export type SectionConfig = {
  id: string;
  type?: SectionType;
  customSectionId?: string;
  variant: string;
  visible: boolean;
  title?: string;
};

export type PortfolioConfig = {
  theme: ThemeName;
  sections: SectionConfig[];
};

export type VariantContentConfig = {
  experienceIds: string[];
  projectIds: string[];
  skills: string[];
};

export type PortfolioBranding = {
  faviconUrl: string;
  shareTitle: string;
  shareDescription: string;
  shareImageUrl: string;
};

export type PortfolioResume = {
  url: string;
  publicId: string;
  fileName: string;
  showInHero: boolean;
  hideSectionWhenHeroLink: boolean;
};

export type PortfolioVariant = {
  id: string;
  name: string;
  targetRole: string;
  /**
   * Content belongs to the portfolio that shows it. Earlier versions kept one
   * shared pool on the state and had every variant select from it, which meant
   * editing one portfolio changed the others.
   */
  data: PortfolioData;
  config: PortfolioConfig;
  /** Ordering and inclusion within this portfolio's own data. */
  content: VariantContentConfig;
  branding: PortfolioBranding;
  resume: PortfolioResume;
};

export type BuilderState = {
  /** Seed for newly created portfolios, and the migration source for
   *  workspaces saved before content became per-portfolio. */
  data: PortfolioData;
  variants: PortfolioVariant[];
  activeVariantId: string;
};

export type PortfolioSnapshot = {
  data: PortfolioData;
  config: PortfolioConfig;
  meta?: {
    name: string;
    targetRole: string;
    branding?: PortfolioBranding;
    resume?: PortfolioResume;
  };
};
