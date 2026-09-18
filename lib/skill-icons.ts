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
  "aws": "amazonwebservices",
  "amazon web services": "amazonwebservices",
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
  const slug = ICON_SLUGS[skill.trim().toLowerCase()];
  return slug ? `https://cdn.simpleicons.org/${slug}` : null;
}

export function skillInitials(skill: string) {
  return skill
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
