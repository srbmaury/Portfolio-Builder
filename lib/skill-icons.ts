const ICON_SLUGS: Record<string, string> = {
  "javascript": "javascript",
  "typescript": "typescript",
  "react": "react",
  "next.js": "nextdotjs",
  "nextjs": "nextdotjs",
  "node.js": "nodedotjs",
  "nodejs": "nodedotjs",
  "express": "express",
  "express.js": "express",
  "java": "openjdk",
  "spring": "spring",
  "spring boot": "springboot",
  "python": "python",
  "flask": "flask",
  "django": "django",
  "go": "go",
  "golang": "go",
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "mysql": "mysql",
  "mongodb": "mongodb",
  "redis": "redis",
  "sqlite": "sqlite",
  "docker": "docker",
  "kubernetes": "kubernetes",
  "graphql": "graphql",
  "github": "github",
  "github actions": "githubactions",
  "git": "git",
  "prometheus": "prometheus",
  "grafana": "grafana",
  "cloudflare": "cloudflare",
  "netlify": "netlify",
  "vercel": "vercel",
  "supabase": "supabase",
  "openai": "openai",
  "d3.js": "d3",
  "d3": "d3",
  "socket.io": "socketdotio",
  "pandas": "pandas",
  "numpy": "numpy",
  "scikit-learn": "scikitlearn",
};

export function skillIconUrl(skill: string) {
  const key = skill.trim().toLowerCase();
  if (["aws", "amazon web services"].includes(key)) return "/skill-icons/aws.svg";
  if (["fastapi", "fast api"].includes(key)) return "/skill-icons/fastapi.svg";
  const slug = ICON_SLUGS[key];
  return slug ? `https://cdn.simpleicons.org/${slug}` : null;
}

export function skillInitials(skill: string) {
  const words = skill.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "";

  // One letter per word reads well for multi-word skills ("Amazon Web
  // Services" -> "AWS"), but reduces a single word to a lone letter. Single
  // words keep their leading characters instead, so "AWS" stays "AWS".
  const initials =
    words.length === 1 ? words[0] : words.map((word) => word[0]).join("");

  return initials.slice(0, 3).toUpperCase();
}
