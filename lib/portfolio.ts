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
  company: string;
  role: string;
  period: string;
  summary: string;
};

export type Project = {
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

export type PortfolioSnapshot = {
  data: PortfolioData;
  config: {
    theme: ThemeName;
    sections: SectionConfig[];
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

export const sampleSnapshot: PortfolioSnapshot = {
  data: {
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
        company: "Northstar Labs",
        role: "Software Engineer",
        period: "2024 — Present",
        summary:
          "Built platform capabilities used by multiple product teams, improving reliability, observability, and developer velocity.",
      },
      {
        company: "Atlas Systems",
        role: "Engineering Intern",
        period: "2023 — 2024",
        summary:
          "Shipped internal tooling and production monitoring that shortened incident investigation time.",
      },
    ],
    projects: [
      {
        title: "Search Engine",
        description:
          "A personalized product search experience with ranked retrieval, caching, and experimentation support.",
        stack: ["Next.js", "PostgreSQL", "Redis"],
        url: "https://github.com",
      },
      {
        title: "Developer Agent",
        description:
          "An agentic debugging workflow that combines code, logs, and issue context to accelerate investigation.",
        stack: ["LLM", "RAG", "MCP"],
        url: "https://github.com",
      },
      {
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
  },
  config: {
    theme: "ink",
    sections: [
      { id: "hero", variant: "split", visible: true },
      { id: "about", variant: "editorial", visible: true },
      { id: "experience", variant: "timeline", visible: true },
      { id: "projects", variant: "bento", visible: true },
      { id: "skills", variant: "cloud", visible: true },
      { id: "contact", variant: "panel", visible: true },
    ],
  },
};

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
