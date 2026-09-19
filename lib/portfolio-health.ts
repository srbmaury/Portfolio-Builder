import {
  sectionType,
  type BuilderState,
  type Project,
} from "./portfolio.ts";

export type PortfolioHealthSeverity = "error" | "warning" | "suggestion";
export type PortfolioHealthTab = "content" | "targeting" | "design";

export type PortfolioHealthIssue = {
  id: string;
  severity: PortfolioHealthSeverity;
  title: string;
  detail: string;
  tab: PortfolioHealthTab;
};

export type PortfolioHealthReport = {
  status: "needs-attention" | "good" | "ready";
  issues: PortfolioHealthIssue[];
  counts: Record<PortfolioHealthSeverity, number>;
};

const imageHeroLayouts = new Set([
  "image-split",
  "cover",
  "portrait",
  "editorial-photo",
  "glass",
]);

const imageProjectLayouts = new Set([
  "image-grid",
  "image-bento",
  "browser",
  "gallery",
]);

export function analyzePortfolioHealth(
  state: BuilderState
): PortfolioHealthReport {
  const variant =
    state.variants.find((item) => item.id === state.activeVariantId) ||
    state.variants[0];

  if (!variant) {
    return report([
      issue(
        "missing-variant",
        "error",
        "No portfolio variant",
        "Create a portfolio variant before publishing.",
        "content"
      ),
    ]);
  }

  const issues: PortfolioHealthIssue[] = [];
  const profile = state.data.profile;
  const visible = (type: string) =>
    variant.config.sections.some(
      (section) => section.visible && sectionType(section) === type
    );

  if (!profile.name.trim()) {
    issues.push(
      issue(
        "profile-name",
        "error",
        "Add your name",
        "The hero and social metadata need a clear owner name.",
        "content"
      )
    );
  }

  if (!variant.targetRole.trim() && !profile.role.trim()) {
    issues.push(
      issue(
        "target-role",
        "error",
        "Add a target role",
        "Set the role this portfolio is positioning you for.",
        "content"
      )
    );
  }

  if (!variant.name.trim()) {
    issues.push(
      issue(
        "variant-name",
        "suggestion",
        "Name this portfolio",
        "A clear variant name makes multiple role-specific portfolios easier to manage.",
        "content"
      )
    );
  }

  if (!profile.tagline.trim()) {
    issues.push(
      issue(
        "tagline",
        "warning",
        "Add a tagline",
        "A short positioning statement makes the hero more informative.",
        "content"
      )
    );
  }

  if (visible("about") && !profile.about.trim()) {
    issues.push(
      issue(
        "about",
        "warning",
        "About section has no story",
        "Add a short professional summary or hide the About section.",
        "content"
      )
    );
  }

  if (visible("contact") && !hasContactMethod(state)) {
    issues.push(
      issue(
        "contact",
        "error",
        "Add a contact method",
        "The Contact section is visible but there is no email or social link.",
        "content"
      )
    );
  }

  const selectedExperience = selectedById(
    state.data.experience,
    variant.content.experienceIds
  );
  if (visible("experience") && selectedExperience.length === 0) {
    issues.push(
      issue(
        "experience-targeting",
        "warning",
        "No experience is targeted",
        "Choose at least one relevant role or hide the Experience section.",
        "targeting"
      )
    );
  }

  const selectedProjects = selectedById(
    state.data.projects,
    variant.content.projectIds
  );
  if (visible("projects") && selectedProjects.length === 0) {
    issues.push(
      issue(
        "projects-targeting",
        "error",
        "No projects are targeted",
        "Choose project evidence for this portfolio or hide the Projects section.",
        "targeting"
      )
    );
  }

  if (visible("skills") && variant.content.skills.length === 0) {
    issues.push(
      issue(
        "skills-targeting",
        "warning",
        "No skills are targeted",
        "Choose the skills that support this portfolio's target role.",
        "targeting"
      )
    );
  }

  selectedProjects.forEach((project) => {
    checkProject(project, issues);
  });

  const invalidSocial = profile.socials.find(
    (social) => social.url.trim() && !isHttpUrl(social.url)
  );
  if (invalidSocial) {
    issues.push(
      issue(
        "social-url",
        "warning",
        "Check profile links",
        `“${invalidSocial.label || "A profile link"}” is not a valid HTTP(S) URL.`,
        "content"
      )
    );
  }

  const resumeSection = variant.config.sections.find(
    (section) => sectionType(section) === "resume"
  );
  if (
    resumeSection?.visible &&
    !variant.resume.url &&
    !variant.resume.hideSectionWhenHeroLink
  ) {
    issues.push(
      issue(
        "resume",
        "suggestion",
        "Resume section has no PDF",
        "Attach a resume or hide the standalone Resume section.",
        "content"
      )
    );
  }

  const hero = variant.config.sections.find(
    (section) => sectionType(section) === "hero"
  );
  if (
    hero?.visible &&
    imageHeroLayouts.has(hero.variant) &&
    !profile.heroImageUrl?.trim()
  ) {
    issues.push(
      issue(
        "hero-image",
        "warning",
        "Selected hero works best with an image",
        "Upload a hero image or choose a text-first hero layout.",
        "design"
      )
    );
  }

  const projectSection = variant.config.sections.find(
    (section) => sectionType(section) === "projects"
  );
  if (
    projectSection?.visible &&
    imageProjectLayouts.has(projectSection.variant) &&
    selectedProjects.some((project) => !project.imageUrl?.trim())
  ) {
    issues.push(
      issue(
        "project-images",
        "suggestion",
        "Some project cards have no image",
        "The selected project layout is image-led. Add screenshots for the strongest result.",
        "content"
      )
    );
  }

  return report(issues);
}

function checkProject(
  project: Project,
  issues: PortfolioHealthIssue[]
) {
  const label = project.title.trim() || "Untitled project";
  const id = project.id || label;

  if (!project.description.trim()) {
    issues.push(
      issue(
        `project-description-${id}`,
        "warning",
        `Describe ${label}`,
        "Add what the project does and why it matters.",
        "content"
      )
    );
  }

  if (project.stack.length === 0) {
    issues.push(
      issue(
        `project-stack-${id}`,
        "warning",
        `Add the stack for ${label}`,
        "Technology context helps recruiters scan the project quickly.",
        "content"
      )
    );
  }

  const links = [project.githubUrl, project.liveUrl].filter(
    (value): value is string => Boolean(value?.trim())
  );

  if (links.length === 0) {
    issues.push(
      issue(
        `project-links-${id}`,
        "suggestion",
        `Add a link for ${label}`,
        "A repository or live demo gives visitors a way to verify the work.",
        "content"
      )
    );
  } else if (links.some((value) => !isHttpUrl(value))) {
    issues.push(
      issue(
        `project-invalid-link-${id}`,
        "warning",
        `Check links for ${label}`,
        "Project links must use a valid HTTP(S) URL.",
        "content"
      )
    );
  }
}

function selectedById<T extends { id: string }>(
  items: T[],
  selectedIds: string[]
) {
  const selected = new Set(selectedIds);
  return items.filter((item) => selected.has(item.id));
}

function hasContactMethod(state: BuilderState) {
  return Boolean(
    state.data.profile.email.trim() ||
      state.data.profile.socials.some((social) => isHttpUrl(social.url))
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function issue(
  id: string,
  severity: PortfolioHealthSeverity,
  title: string,
  detail: string,
  tab: PortfolioHealthTab
): PortfolioHealthIssue {
  return { id, severity, title, detail, tab };
}

function report(issues: PortfolioHealthIssue[]): PortfolioHealthReport {
  const counts = {
    error: issues.filter((item) => item.severity === "error").length,
    warning: issues.filter((item) => item.severity === "warning").length,
    suggestion: issues.filter((item) => item.severity === "suggestion").length,
  };

  return {
    status:
      counts.error > 0
        ? "needs-attention"
        : counts.warning > 0
          ? "good"
          : "ready",
    issues,
    counts,
  };
}
