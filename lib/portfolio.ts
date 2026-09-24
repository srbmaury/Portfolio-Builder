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

export const sampleData: PortfolioData = {
  profile: {
    name: "Maya Chen",
    role: "Software Engineer",
    tagline:
      "I build dependable systems, fast internal tools, and product experiences that stay simple as they scale.",
    about:
      "I am a product-minded software engineer who enjoys the seams between backend architecture, developer experience, and thoughtful interfaces. I like turning ambiguous operational problems into systems that are observable, maintainable, and easy for other teams to build on.",
    email: "maya@example.com",
    location: "Bengaluru, India",
    availability: "Open to backend, platform, and product engineering opportunities",
    heroImageUrl: "",
    socials: [
      { label: "GitHub", url: "https://github.com" },
      { label: "LinkedIn", url: "https://linkedin.com" },
    ],
  },
  experience: [
    {
      id: "exp-meridian",
      company: "Meridian Cloud",
      role: "Software Engineer",
      period: "2024 — Present",
      summary:
        "Built shared platform services for deployment metadata, caching, and observability. Cut repetitive release work by automating dependency discovery and gave product teams clearer operational signals during incidents.",
    },
    {
      id: "exp-relay",
      company: "Relay Systems",
      role: "Associate Software Engineer",
      period: "2023 — 2024",
      summary:
        "Shipped workflow APIs and internal tooling used by operations teams, with a focus on predictable failure handling, faster debugging, and safer incremental releases.",
    },
    {
      id: "exp-orbit",
      company: "Orbit Labs",
      role: "Software Engineering Intern",
      period: "2022 — 2023",
      summary:
        "Created service dashboards, alerts, and automation around a growing payments platform, helping engineers move from reactive debugging to measurable service health.",
    },
  ],
  projects: [
    {
      id: "project-traceflow",
      title: "TraceFlow",
      description:
        "A developer investigation workspace that brings logs, traces, source context, and deployment history into one searchable timeline for faster incident triage.",
      stack: ["Java", "PostgreSQL", "Redis", "OpenTelemetry"],
      imageUrl: "",
      githubUrl: "https://github.com",
      liveUrl: "",
    },
    {
      id: "project-vector-gateway",
      title: "Vector Search Gateway",
      description:
        "A multi-tenant retrieval service with hybrid search, request-level caching, ingestion jobs, and observable ranking experiments behind a simple API.",
      stack: ["Go", "PostgreSQL", "Redis", "Kafka"],
      imageUrl: "",
      githubUrl: "https://github.com",
      liveUrl: "",
    },
    {
      id: "project-schema-studio",
      title: "Schema Studio",
      description:
        "A collaborative schema editor that turns structured configuration into explorable diagrams, reviewable changes, and shareable developer documentation.",
      stack: ["TypeScript", "React", "WebSockets", "D3"],
      imageUrl: "",
      githubUrl: "https://github.com",
      liveUrl: "",
    },
    {
      id: "project-queuescope",
      title: "QueueScope",
      description:
        "An operations console for delayed jobs and event pipelines with replay controls, failure grouping, throughput trends, and guardrails for production recovery.",
      stack: ["Java", "Kafka", "React", "Observability"],
      imageUrl: "",
      githubUrl: "https://github.com",
      liveUrl: "",
    },
  ],
  skills: [
    "Java",
    "Go",
    "TypeScript",
    "React",
    "Distributed Systems",
    "PostgreSQL",
    "Redis",
    "Kafka",
    "Kubernetes",
    "AWS",
    "Observability",
    "System Design",
  ],
  customSections: [
    {
      id: "impact",
      title: "Selected impact",
      items: [
        {
          id: "impact-release",
          heading: "10×",
          subheading: "Faster release preparation",
          meta: "Platform automation",
          description:
            "Automated dependency discovery and validation that replaced a manual release checklist across multiple component types.",
          linkLabel: "",
          linkUrl: "",
        },
        {
          id: "impact-debugging",
          heading: "< 10 min",
          subheading: "From alert to useful context",
          meta: "Observability",
          description:
            "Connected service metrics, dashboards, and actionable alerts so engineers could narrow down production issues without reconstructing context by hand.",
          linkLabel: "",
          linkUrl: "",
        },
        {
          id: "impact-scale",
          heading: "4 teams",
          subheading: "Building on shared platform primitives",
          meta: "Developer experience",
          description:
            "Designed reusable platform capabilities and documentation that product teams could adopt without owning the underlying infrastructure.",
          linkLabel: "",
          linkUrl: "",
        },
      ],
    },
  ],
};
export function cloneConfig(config: PortfolioConfig): PortfolioConfig {
  return {
    theme: config.theme,
    sections: config.sections.map((section) => ({ ...section })),
  };
}

export function fullContentConfig(data: PortfolioData): VariantContentConfig {
  return {
    experienceIds: data.experience.map((item) => item.id),
    projectIds: data.projects.map((item) => item.id),
    skills: [...data.skills],
  };
}

/** Deep copy so one portfolio's edits cannot reach another's content. */
/**
 * Keeps the invariant that state.data is the open portfolio's own data.
 * Helpers that build a new state from scratch must go through this, or the
 * edit lands on the working copy but never on the portfolio that owns it.
 */
export function syncActiveData(state: BuilderState): BuilderState {
  return {
    ...state,
    variants: state.variants.map((variant) =>
      variant.id === state.activeVariantId
        ? { ...variant, data: state.data }
        : variant
    ),
  };
}

export function cloneData(data: PortfolioData): PortfolioData {
  return {
    profile: { ...data.profile, socials: data.profile.socials.map((s) => ({ ...s })) },
    experience: data.experience.map((item) => ({ ...item })),
    projects: data.projects.map((item) => ({ ...item, stack: [...item.stack] })),
    skills: [...data.skills],
    customSections: data.customSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

export function cloneContentConfig(
  content: VariantContentConfig
): VariantContentConfig {
  return {
    experienceIds: [...content.experienceIds],
    projectIds: [...content.projectIds],
    skills: [...content.skills],
  };
}

const sampleBackendConfig: PortfolioConfig = {
  theme: "mono",
  sections: [
    { id: "hero", type: "hero", variant: "split", visible: true, title: "Backend & Platform" },
    { id: "about", type: "about", variant: "dossier", visible: true, title: "Profile" },
    { id: "experience", type: "experience", variant: "ledger", visible: true, title: "Experience" },
    { id: "projects", type: "projects", variant: "github", visible: true, title: "Selected systems" },
    {
      id: "custom-impact",
      type: "custom",
      customSectionId: "impact",
      variant: "spotlight",
      visible: true,
      title: "Impact",
    },
    { id: "skills", type: "skills", variant: "logo-grid", visible: true, title: "Technical toolkit" },
    { id: "resume", type: "resume", variant: "compact", visible: false, title: "Résumé" },
    { id: "contact", type: "contact", variant: "split", visible: true, title: "Let’s build" },
  ],
};

const sampleProductConfig: PortfolioConfig = {
  theme: "sunset",
  sections: [
    { id: "hero", type: "hero", variant: "poster", visible: true, title: "Product Engineering" },
    { id: "projects", type: "projects", variant: "showcase", visible: true, title: "Things I shipped" },
    { id: "about", type: "about", variant: "statement", visible: true, title: "How I work" },
    { id: "experience", type: "experience", variant: "stacked", visible: true, title: "Experience" },
    {
      id: "custom-impact",
      type: "custom",
      customSectionId: "impact",
      variant: "badges",
      visible: true,
      title: "Proof points",
    },
    { id: "skills", type: "skills", variant: "ticker", visible: true, title: "Stack" },
    { id: "resume", type: "resume", variant: "minimal", visible: false, title: "Résumé" },
    { id: "contact", type: "contact", variant: "banner", visible: true, title: "Start a conversation" },
  ],
};

export const sampleBuilderState: BuilderState = {
  data: sampleData,
  variants: [
    {
      id: "backend-platform",
      name: "Backend & Platform",
      targetRole: "Backend & Platform Engineer",
      data: sampleData,
      config: cloneConfig(sampleBackendConfig),
      content: {
        experienceIds: ["exp-meridian", "exp-relay", "exp-orbit"],
        projectIds: [
          "project-traceflow",
          "project-vector-gateway",
          "project-queuescope",
        ],
        skills: [
          "Java",
          "Go",
          "Distributed Systems",
          "PostgreSQL",
          "Redis",
          "Kafka",
          "Kubernetes",
          "AWS",
          "Observability",
          "System Design",
        ],
      },
      branding: {
        faviconUrl: "",
        shareTitle: "Maya Chen — Backend & Platform Engineer",
        shareDescription:
          "Distributed systems, platform engineering, observability, and developer tooling.",
        shareImageUrl: "",
      },
      resume: cloneResume(),
    },
    {
      id: "product-engineer",
      name: "Product Engineer",
      targetRole: "Product Engineer",
      data: sampleData,
      config: cloneConfig(sampleProductConfig),
      content: {
        experienceIds: ["exp-meridian", "exp-relay"],
        projectIds: [
          "project-schema-studio",
          "project-traceflow",
          "project-queuescope",
        ],
        skills: [
          "TypeScript",
          "React",
          "Java",
          "PostgreSQL",
          "Redis",
          "Observability",
          "System Design",
        ],
      },
      branding: {
        faviconUrl: "",
        shareTitle: "Maya Chen — Product Engineer",
        shareDescription:
          "Product-minded engineering across thoughtful interfaces, developer tools, and reliable systems.",
        shareImageUrl: "",
      },
      resume: cloneResume(),
    },
  ],
  activeVariantId: "backend-platform",
};
export const emptyData: PortfolioData = {
  profile: {
    name: "",
    role: "",
    tagline: "",
    about: "",
    email: "",
    location: "",
    availability: "",
    heroImageUrl: "",
    socials: [],
  },
  experience: [],
  projects: [],
  skills: [],
  customSections: [],
};

export const emptyBuilderState: BuilderState = {
  data: emptyData,
  variants: [
    {
      id: "portfolio",
      name: "",
      targetRole: "",
      data: emptyData,
      config: cloneConfig(defaultConfig),
      content: fullContentConfig(emptyData),
      branding: cloneBranding(),
      resume: cloneResume(),
    },
  ],
  activeVariantId: "portfolio",
};

export const sampleSnapshot: PortfolioSnapshot =
  snapshotForVariant(sampleBuilderState);

/**
 * Experience and project ids are primary keys shared by every account in the
 * database, so a workspace that reuses fixed ids (the demo) collides as soon
 * as a second account saves it. Give each loaded copy its own ids, remapped
 * everywhere they are referenced.
 */
export function withFreshContentIds(
  state: BuilderState,
  suffix: string = crypto.randomUUID().slice(0, 8)
): BuilderState {
  const ids = new Map<string, string>();
  const fresh = (id: string) => {
    let next = ids.get(id);
    if (!next) {
      next = `${id}-${suffix}`;
      ids.set(id, next);
    }
    return next;
  };
  const remapData = (data: PortfolioData): PortfolioData => ({
    ...data,
    experience: data.experience.map((item) => ({ ...item, id: fresh(item.id) })),
    projects: data.projects.map((item) => ({ ...item, id: fresh(item.id) })),
  });

  return {
    ...state,
    data: remapData(state.data),
    variants: state.variants.map((variant) => ({
      ...variant,
      data: remapData(variant.data),
      content: {
        ...variant.content,
        experienceIds: variant.content.experienceIds.map(fresh),
        projectIds: variant.content.projectIds.map(fresh),
      },
    })),
  };
}

export function snapshotForVariant(state: BuilderState): PortfolioSnapshot {
  const normalized = normalizeBuilderState(state);
  const active =
    normalized.variants.find(
      (variant) => variant.id === normalized.activeVariantId
    ) ?? normalized.variants[0];

  if (!active) {
    return {
      data: normalized.data,
      config: cloneConfig(defaultConfig),
      meta: {
        name: "Portfolio",
        targetRole: normalized.data.profile.role,
        branding: cloneBranding(),
        resume: cloneResume(),
      },
    };
  }

  // The portfolio publishes its own content, not a shared pool.
  const activeData = active.data;
  const experienceById = new Map(
    activeData.experience.map((item) => [item.id, item])
  );
  const projectById = new Map(activeData.projects.map((item) => [item.id, item]));
  const validSkills = new Set(activeData.skills);
  const customIds = new Set(
    active.config.sections
      .filter((section) => sectionType(section) === "custom")
      .map((section) => section.customSectionId)
      .filter((id): id is string => Boolean(id))
  );

  return {
    data: {
      ...activeData,
      profile: {
        ...activeData.profile,
        role: active.targetRole || activeData.profile.role,
      },
      experience: active.content.experienceIds
        .map((id) => experienceById.get(id))
        .filter((item): item is Experience => Boolean(item)),
      projects: active.content.projectIds
        .map((id) => projectById.get(id))
        .filter((item): item is Project => Boolean(item)),
      skills: active.content.skills.filter((skill) => validSkills.has(skill)),
      customSections: activeData.customSections.filter((section) =>
        customIds.has(section.id)
      ),
    },
    config: cloneConfig(active.config),
    meta: {
      name: active.name,
      targetRole: active.targetRole,
      branding: cloneBranding(active.branding),
      resume: cloneResume(active.resume),
    },
  };
}

export function normalizeBuilderState(input: BuilderState): BuilderState {
  const data = normalizeData(input?.data || ({} as PortfolioData));
  const fallbackContent = fullContentConfig(data);
  const validExperience = new Set(data.experience.map((item) => item.id));
  const validProjects = new Set(data.projects.map((item) => item.id));
  const validSkills = new Set(data.skills);

  const rawVariants = Array.isArray(input?.variants) ? input.variants : [];
  const variants = rawVariants.map((variant, index) => {
    const rawContent = variant.content as VariantContentConfig | undefined;

    // A workspace saved before content became per-portfolio has no data on its
    // variants. Each one inherits a full copy of the old shared pool, so its
    // published output is unchanged while its edits become independent.
    const rawVariantData = (variant as { data?: PortfolioData }).data;
    const variantData = rawVariantData ? normalizeData(rawVariantData) : data;

    const variantValidExperience = new Set(
      variantData.experience.map((item) => item.id)
    );
    const variantValidProjects = new Set(
      variantData.projects.map((item) => item.id)
    );
    const variantValidSkills = new Set(variantData.skills);
    const variantFallback = fullContentConfig(variantData);

    const experienceIds = rawContent?.experienceIds?.filter((id) =>
      variantValidExperience.has(id)
    );
    const projectIds = rawContent?.projectIds?.filter((id) =>
      variantValidProjects.has(id)
    );
    const skills = rawContent?.skills?.filter((skill) =>
      variantValidSkills.has(skill)
    );

    return {
      ...variant,
      data: variantData,
      id: variant.id || `portfolio-${index + 1}`,
      name:
        typeof variant.name === "string"
          ? variant.name
          : `Portfolio ${index + 1}`,
      targetRole:
        typeof variant.targetRole === "string"
          ? variant.targetRole
          : data.profile.role,
      config: normalizePortfolioConfig(variant.config, variantData.customSections),
      branding: {
        faviconUrl:
          typeof variant.branding?.faviconUrl === "string"
            ? variant.branding.faviconUrl
            : "",
        shareTitle:
          typeof variant.branding?.shareTitle === "string"
            ? variant.branding.shareTitle
            : "",
        shareDescription:
          typeof variant.branding?.shareDescription === "string"
            ? variant.branding.shareDescription
            : "",
        shareImageUrl:
          typeof variant.branding?.shareImageUrl === "string"
            ? variant.branding.shareImageUrl
            : "",
      },
      resume: {
        url:
          typeof variant.resume?.url === "string"
            ? variant.resume.url
            : "",
        publicId:
          typeof variant.resume?.publicId === "string"
            ? variant.resume.publicId
            : "",
        fileName:
          typeof variant.resume?.fileName === "string"
            ? variant.resume.fileName
            : "",
        showInHero:
          typeof variant.resume?.showInHero === "boolean"
            ? variant.resume.showInHero
            : false,
        hideSectionWhenHeroLink:
          typeof variant.resume?.hideSectionWhenHeroLink === "boolean"
            ? variant.resume.hideSectionWhenHeroLink
            : false,
      },
      content: {
        experienceIds:
          rawContent?.experienceIds !== undefined
            ? experienceIds || []
            : variantFallback.experienceIds,
        projectIds:
          rawContent?.projectIds !== undefined
            ? projectIds || []
            : variantFallback.projectIds,
        skills:
          rawContent?.skills !== undefined ? skills || [] : variantFallback.skills,
      },
    };
  });

  if (!variants.length) {
    variants.push({
      id: "general",
      name: "General",
      targetRole: data.profile.role,
      data,
      config: normalizePortfolioConfig(defaultConfig, data.customSections),
      content: fallbackContent,
      branding: cloneBranding(),
      resume: cloneResume(),
    });
  }

  const activeVariantId = variants.some(
    (variant) => variant.id === input?.activeVariantId
  )
    ? input.activeVariantId
    : variants[0].id;

  // The working data is always the open portfolio's own data, so every reader
  // of state.data sees the portfolio currently being edited rather than a
  // pool shared with the others.
  const active =
    variants.find((variant) => variant.id === activeVariantId) ?? variants[0];

  return {
    data: active.data,
    variants,
    activeVariantId,
  };
}

function normalizePortfolioConfig(
  input: PortfolioConfig | undefined,
  customSections: CustomSection[]
): PortfolioConfig {
  const rawSections = Array.isArray(input?.sections) ? input.sections : [];
  const defaultByType = new Map(
    defaultConfig.sections.map((section) => [sectionType(section), section])
  );
  const validCustom = new Map(customSections.map((section) => [section.id, section]));
  const seenBuiltIns = new Set<BuiltInSectionType>();
  const seenCustom = new Set<string>();
  const sections: SectionConfig[] = [];

  for (const raw of rawSections) {
    if (!raw || typeof raw !== "object") continue;
    const type = sectionType(raw);

    if (type === "custom") {
      const customId = raw.customSectionId;
      const custom = customId ? validCustom.get(customId) : undefined;
      if (!custom || seenCustom.has(custom.id)) continue;

      seenCustom.add(custom.id);
      sections.push({
        id: raw.id || `custom-${custom.id}`,
        type: "custom",
        customSectionId: custom.id,
        variant:
          typeof raw.variant === "string" &&
          templateCatalog.custom.some((option) => option.id === raw.variant)
            ? raw.variant
            : "list",
        visible: Boolean(raw.visible),
        title:
          typeof raw.title === "string" && raw.title.trim()
            ? raw.title
            : custom.title,
      });
      continue;
    }

    const builtIn = type as BuiltInSectionType;
    if (seenBuiltIns.has(builtIn)) continue;
    const fallback = defaultByType.get(builtIn);
    if (!fallback) continue;

    seenBuiltIns.add(builtIn);
    sections.push({
      ...fallback,
      ...raw,
      id: builtIn,
      type: builtIn,
      variant:
        typeof raw.variant === "string" &&
        templateCatalog[builtIn].some((option) => option.id === raw.variant)
          ? raw.variant
          : fallback.variant,
      visible:
        typeof raw.visible === "boolean" ? raw.visible : fallback.visible,
      title:
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title
          : fallback.title,
    });
  }

  for (const fallback of defaultConfig.sections) {
    const type = sectionType(fallback) as BuiltInSectionType;
    if (!seenBuiltIns.has(type)) {
      sections.push({ ...fallback, id: type, type });
    }
  }

  for (const custom of customSections) {
    if (!seenCustom.has(custom.id)) {
      sections.push({
        id: `custom-${custom.id}`,
        type: "custom",
        customSectionId: custom.id,
        variant: "list",
        visible: false,
        title: custom.title,
      });
    }
  }

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

  return {
    theme:
      input?.theme && themes.includes(input.theme)
        ? input.theme
        : defaultConfig.theme,
    sections,
  };
}

export function normalizeData(input: PortfolioData): PortfolioData {
  const profileInput = input?.profile || ({} as Profile);
  const profile: Profile = {
    name: typeof profileInput.name === "string" ? profileInput.name : "",
    role: typeof profileInput.role === "string" ? profileInput.role : "",
    tagline: typeof profileInput.tagline === "string" ? profileInput.tagline : "",
    about: typeof profileInput.about === "string" ? profileInput.about : "",
    email: typeof profileInput.email === "string" ? profileInput.email : "",
    location: typeof profileInput.location === "string" ? profileInput.location : "",
    availability:
      typeof profileInput.availability === "string" ? profileInput.availability : "",
    heroImageUrl:
      typeof profileInput.heroImageUrl === "string" ? profileInput.heroImageUrl : "",
    socials: Array.isArray(profileInput.socials)
      ? profileInput.socials
          .filter((social) => social && typeof social === "object")
          .map((social) => ({
            label: typeof social.label === "string" ? social.label : "",
            url: typeof social.url === "string" ? social.url : "",
          }))
      : [],
  };

  return {
    profile,
    experience: (input?.experience || []).map((item, index) => ({
      ...item,
      id:
        (item as Experience).id ||
        stableEntityId("experience", `${item.company}-${item.role}`, index),
    })),
    projects: (input?.projects || []).map((item, index) => ({
      ...item,
      id:
        (item as Project).id ||
        stableEntityId("project", item.title, index),
      stack: Array.isArray(item.stack) ? item.stack.filter(Boolean) : [],
    })),
    skills: Array.from(new Set((input?.skills || []).filter(Boolean))),
    customSections: (input?.customSections || [])
      .filter((section) => section && typeof section === "object")
      .map((section, sectionIndex) => ({
        id:
          section.id ||
          stableEntityId("custom-section", section.title || "section", sectionIndex),
        title:
          typeof section.title === "string" && section.title.trim()
            ? section.title
            : "Custom section",
        items: (section.items || [])
          .filter((item) => item && typeof item === "object")
          .map((item, itemIndex) => ({
            id:
              item.id ||
              stableEntityId(
                "custom-item",
                item.heading || `item-${itemIndex + 1}`,
                itemIndex
              ),
            heading: typeof item.heading === "string" ? item.heading : "",
            subheading:
              typeof item.subheading === "string" ? item.subheading : "",
            meta: typeof item.meta === "string" ? item.meta : "",
            description:
              typeof item.description === "string" ? item.description : "",
            linkLabel:
              typeof item.linkLabel === "string" ? item.linkLabel : "",
            linkUrl: typeof item.linkUrl === "string" ? item.linkUrl : "",
          })),
      })),
  };
}

export function createEntityId(
  prefix: "experience" | "project" | "custom-section" | "custom-item"
) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function stableEntityId(prefix: string, value: string, index: number) {
  return `${prefix}-${slugify(value)}-${index + 1}`;
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "portfolio"
  );
}

/**
 * Demo personas that have seeded new workspaces in the past. Matching only the
 * current persona would strand anyone seeded under an earlier one, leaving a
 * stranger's name in their public URL forever, so retired names stay listed.
 */
const RETIRED_DEMO_NAME_SLUGS = ["alex-morgan"];

export function publicUsernameForProfile(
  existingUsername: string | null | undefined,
  profileName: string,
  userId: string
) {
  const profileSlug = slugify(profileName).slice(0, 30);
  const generated = `${profileSlug}-${userId.slice(0, 6)}`;
  const demoSlugs = [
    slugify(sampleData.profile.name),
    ...RETIRED_DEMO_NAME_SLUGS,
  ];

  // A demo-generated username is replaced once the profile carries a real
  // name; a user actually called after the demo persona keeps theirs.
  const isDemoGenerated =
    Boolean(existingUsername) &&
    demoSlugs.some(
      (demoSlug) =>
        existingUsername!.startsWith(`${demoSlug}-`) && profileSlug !== demoSlug
    );

  if (existingUsername && !isDemoGenerated) {
    return existingUsername;
  }

  return generated;
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
