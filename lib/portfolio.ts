export type SectionType =
  | "hero"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "contact";

export type ThemeName = "ink" | "sand" | "moss";

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  about: string;
  email: string;
  location: string;
  availability: string;
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
  url?: string;
};

export type PortfolioData = {
  profile: Profile;
  experience: Experience[];
  projects: Project[];
  skills: string[];
};

export type SectionConfig = {
  id: SectionType;
  variant: string;
  visible: boolean;
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

export type PortfolioVariant = {
  id: string;
  name: string;
  targetRole: string;
  config: PortfolioConfig;
  content: VariantContentConfig;
};

export type BuilderState = {
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
  };
};

export const templateCatalog: Record<
  SectionType,
  Array<{ id: string; label: string; description: string }>
> = {
  hero: [
    { id: "split", label: "Split", description: "Big intro with profile panel" },
    { id: "minimal", label: "Minimal", description: "Editorial, text-first hero" },
    { id: "terminal", label: "Terminal", description: "Developer-inspired intro" },
  ],
  about: [
    { id: "editorial", label: "Editorial", description: "Readable long-form story" },
    { id: "stats", label: "Snapshot", description: "Bio plus profile highlights" },
  ],
  experience: [
    { id: "timeline", label: "Timeline", description: "Chronological career path" },
    { id: "cards", label: "Cards", description: "Compact role cards" },
  ],
  projects: [
    { id: "bento", label: "Bento", description: "Feature-led project grid" },
    { id: "grid", label: "Grid", description: "Balanced project cards" },
    { id: "list", label: "List", description: "Dense, recruiter-friendly list" },
  ],
  skills: [
    { id: "cloud", label: "Cloud", description: "Scannable skill chips" },
    { id: "columns", label: "Columns", description: "Clean technical inventory" },
  ],
  contact: [
    { id: "panel", label: "Panel", description: "Strong final call to action" },
    { id: "minimal", label: "Minimal", description: "Simple contact footer" },
  ],
};

export const defaultConfig: PortfolioConfig = {
  theme: "ink",
  sections: [
    { id: "hero", variant: "split", visible: true },
    { id: "about", variant: "editorial", visible: true },
    { id: "experience", variant: "timeline", visible: true },
    { id: "projects", variant: "bento", visible: true },
    { id: "skills", variant: "cloud", visible: true },
    { id: "contact", variant: "panel", visible: true },
  ],
};

export const sampleData: PortfolioData = {
  profile: {
    name: "Alex Morgan",
    role: "Software Engineer",
    tagline: "I build reliable products that turn complex systems into simple experiences.",
    about:
      "I am a product-minded software engineer focused on backend systems, developer tooling, and thoughtful user experiences. I enjoy taking ambiguous problems from architecture to production.",
    email: "alex@example.com",
    location: "Bengaluru, India",
    availability: "Open to interesting product and platform roles",
    socials: [
      { label: "GitHub", url: "https://github.com" },
      { label: "LinkedIn", url: "https://linkedin.com" },
    ],
  },
  experience: [
    {
      id: "exp-northstar",
      company: "Northstar Labs",
      role: "Software Engineer",
      period: "2024 — Present",
      summary:
        "Built platform capabilities used by multiple product teams, improving reliability, observability, and developer velocity.",
    },
    {
      id: "exp-atlas",
      company: "Atlas Systems",
      role: "Engineering Intern",
      period: "2023 — 2024",
      summary:
        "Shipped internal tooling and production monitoring that shortened incident investigation time.",
    },
  ],
  projects: [
    {
      id: "project-search",
      title: "Search Engine",
      description:
        "A personalized product search experience with ranked retrieval, caching, and experimentation support.",
      stack: ["Next.js", "PostgreSQL", "Redis"],
      url: "https://github.com",
    },
    {
      id: "project-agent",
      title: "Developer Agent",
      description:
        "An agentic debugging workflow that combines code, logs, and issue context to accelerate investigation.",
      stack: ["LLM", "RAG", "MCP"],
      url: "https://github.com",
    },
    {
      id: "project-visualizer",
      title: "Realtime Visualizer",
      description:
        "A collaborative visualization tool built for large structured documents and realtime editing.",
      stack: ["React", "WebSockets", "D3"],
      url: "https://github.com",
    },
  ],
  skills: [
    "Java",
    "TypeScript",
    "Distributed Systems",
    "PostgreSQL",
    "Redis",
    "React",
    "Observability",
    "System Design",
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

export function cloneContentConfig(
  content: VariantContentConfig
): VariantContentConfig {
  return {
    experienceIds: [...content.experienceIds],
    projectIds: [...content.projectIds],
    skills: [...content.skills],
  };
}

export const sampleBuilderState: BuilderState = {
  data: sampleData,
  variants: [
    {
      id: "general",
      name: "General",
      targetRole: "Software Engineer",
      config: cloneConfig(defaultConfig),
      content: fullContentConfig(sampleData),
    },
  ],
  activeVariantId: "general",
};

export const sampleSnapshot: PortfolioSnapshot = {
  data: sampleData,
  config: cloneConfig(defaultConfig),
  meta: {
    name: "General",
    targetRole: "Software Engineer",
  },
};

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
      },
    };
  }

  const experienceById = new Map(
    normalized.data.experience.map((item) => [item.id, item])
  );
  const projectById = new Map(
    normalized.data.projects.map((item) => [item.id, item])
  );
  const validSkills = new Set(normalized.data.skills);

  return {
    data: {
      ...normalized.data,
      profile: {
        ...normalized.data.profile,
        role: active.targetRole || normalized.data.profile.role,
      },
      experience: active.content.experienceIds
        .map((id) => experienceById.get(id))
        .filter((item): item is Experience => Boolean(item)),
      projects: active.content.projectIds
        .map((id) => projectById.get(id))
        .filter((item): item is Project => Boolean(item)),
      skills: active.content.skills.filter((skill) => validSkills.has(skill)),
    },
    config: active.config,
    meta: {
      name: active.name,
      targetRole: active.targetRole,
    },
  };
}

export function builderStateFromSnapshot(
  snapshot: PortfolioSnapshot
): BuilderState {
  const data = normalizeData(snapshot.data);
  const variant: PortfolioVariant = {
    id: "general",
    name: snapshot.meta?.name || "General",
    targetRole: snapshot.meta?.targetRole || data.profile.role,
    config: cloneConfig(snapshot.config),
    content: fullContentConfig(data),
  };

  return {
    data,
    variants: [variant],
    activeVariantId: variant.id,
  };
}

export function normalizeBuilderState(input: BuilderState): BuilderState {
  const data = normalizeData(input.data);
  const fallbackContent = fullContentConfig(data);
  const validExperience = new Set(data.experience.map((item) => item.id));
  const validProjects = new Set(data.projects.map((item) => item.id));
  const validSkills = new Set(data.skills);

  const variants = (input.variants || []).map((variant, index) => {
    const rawContent = variant.content as VariantContentConfig | undefined;

    const experienceIds = rawContent?.experienceIds?.filter((id) =>
      validExperience.has(id)
    );
    const projectIds = rawContent?.projectIds?.filter((id) =>
      validProjects.has(id)
    );
    const skills = rawContent?.skills?.filter((skill) => validSkills.has(skill));

    return {
      ...variant,
      id: variant.id || `portfolio-${index + 1}`,
      name: variant.name || `Portfolio ${index + 1}`,
      targetRole: variant.targetRole || data.profile.role,
      config: variant.config
        ? cloneConfig(variant.config)
        : cloneConfig(defaultConfig),
      content: {
        experienceIds:
          rawContent?.experienceIds !== undefined
            ? experienceIds || []
            : fallbackContent.experienceIds,
        projectIds:
          rawContent?.projectIds !== undefined
            ? projectIds || []
            : fallbackContent.projectIds,
        skills:
          rawContent?.skills !== undefined ? skills || [] : fallbackContent.skills,
      },
    };
  });

  if (!variants.length) {
    variants.push({
      id: "general",
      name: "General",
      targetRole: data.profile.role,
      config: cloneConfig(defaultConfig),
      content: fallbackContent,
    });
  }

  const activeVariantId = variants.some(
    (variant) => variant.id === input.activeVariantId
  )
    ? input.activeVariantId
    : variants[0].id;

  return {
    data,
    variants,
    activeVariantId,
  };
}

export function normalizeData(input: PortfolioData): PortfolioData {
  return {
    ...input,
    experience: (input.experience || []).map((item, index) => ({
      ...item,
      id:
        (item as Experience).id ||
        stableEntityId("experience", `${item.company}-${item.role}`, index),
    })),
    projects: (input.projects || []).map((item, index) => ({
      ...item,
      id:
        (item as Project).id ||
        stableEntityId("project", item.title, index),
    })),
    skills: Array.from(new Set((input.skills || []).filter(Boolean))),
  };
}

export function createEntityId(prefix: "experience" | "project") {
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

export function encodeSnapshot(snapshot: PortfolioSnapshot) {
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return encodeURIComponent(btoa(binary));
}

export function decodeSnapshot(value: string): PortfolioSnapshot {
  const encoded = decodeURIComponent(value);
  let json: string;

  if (typeof window === "undefined") {
    json = Buffer.from(encoded, "base64").toString("utf8");
  } else {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    json = new TextDecoder().decode(bytes);
  }

  return JSON.parse(json) as PortfolioSnapshot;
}
