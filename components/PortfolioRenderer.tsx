import Image from "next/image";
import { ResumeModalLauncher } from "@/components/ResumeModalLauncher";
import { SkillLogo } from "@/components/SkillLogo";
import { analyticsSocialTarget } from "@/lib/analytics";
import {
  sectionDisplayTitle,
  sectionHasContent,
  sectionType,
} from "@/lib/portfolio";
import type { PortfolioSnapshot, Project, SectionConfig } from "@/lib/portfolio";

type Props = {
  snapshot: PortfolioSnapshot;
  compact?: boolean;
  publicResumeUrl?: string;
};

export function PortfolioRenderer({
  snapshot,
  compact = false,
  publicResumeUrl,
}: Props) {
  const { config } = snapshot;
  const visibleSections = config.sections.filter(
    (section) =>
      section.visible &&
      sectionHasContent(section, snapshot.data, snapshot.meta?.resume)
  );

  return (
    <>
      {!compact ? (
        <a className="skip-link" href="#portfolio-main">
          Skip to portfolio content
        </a>
      ) : null}
      <main
        id={compact ? undefined : "portfolio-main"}
        className={`portfolio theme-${config.theme} ${compact ? "portfolio-compact" : ""}`}
      >
        {!compact ? (
          <PortfolioNavigation snapshot={snapshot} sections={visibleSections} />
        ) : null}
        <div className="portfolio-frame">
          {visibleSections.map((section) => (
            <div
              id={portfolioSectionAnchor(section)}
              className="portfolio-section-anchor"
              key={section.id}
            >
              <PortfolioSection
                section={section}
                snapshot={snapshot}
                publicResumeUrl={publicResumeUrl}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

function PortfolioNavigation({
  snapshot,
  sections,
}: {
  snapshot: PortfolioSnapshot;
  sections: SectionConfig[];
}) {
  // The hero is the page's top destination rather than another section link.
  // Every other item comes from the exact list that is actually rendered, so
  // hidden or empty sections never leak into navigation.
  const items = sections
    .filter((section) => sectionType(section) !== "hero")
    .map((section) => ({
      id: portfolioSectionAnchor(section),
      label: portfolioSectionTitle(snapshot, section),
    }));

  if (!items.length) return null;

  const name =
    snapshot.data.profile.name.trim() ||
    snapshot.meta?.name?.trim() ||
    "Portfolio";

  return (
    <nav className="portfolio-nav" aria-label="Portfolio sections">
      <div className="portfolio-nav-inner">
        <a className="portfolio-nav-name" href="#portfolio-main">
          {name}
        </a>

        <div className="portfolio-nav-links">
          {items.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </div>

        <details className="portfolio-nav-mobile">
          <summary aria-label="Open portfolio navigation">
            <span>Sections</span>
            <b aria-hidden="true">+</b>
          </summary>
          <div>
            {items.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </nav>
  );
}

function portfolioSectionTitle(
  snapshot: PortfolioSnapshot,
  section: SectionConfig
) {
  const type = sectionType(section);

  if (type === "custom") {
    const custom = snapshot.data.customSections.find(
      (item) => item.id === section.customSectionId
    );
    return section.title?.trim() || custom?.title?.trim() || "Custom section";
  }

  return sectionDisplayTitle(type, section.title);
}

function portfolioSectionAnchor(section: SectionConfig) {
  const safe = section.id
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `portfolio-section-${safe || "section"}`;
}

function PortfolioSection({
  section,
  snapshot,
  publicResumeUrl,
}: {
  section: SectionConfig;
  snapshot: PortfolioSnapshot;
  publicResumeUrl?: string;
}) {
  switch (sectionType(section)) {
    case "hero":
      return (
        <Hero
          snapshot={snapshot}
          variant={section.variant}
          title={section.title}
          publicResumeUrl={publicResumeUrl}
        />
      );
    case "about":
      return <About snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "experience":
      return <Experience snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "projects":
      return <Projects snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "skills":
      return <Skills snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "resume":
      return (
        <Resume
          snapshot={snapshot}
          variant={section.variant}
          title={section.title}
          publicResumeUrl={publicResumeUrl}
        />
      );
    case "contact":
      return <Contact snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "custom":
      return <CustomSectionBlock snapshot={snapshot} section={section} />;
  }
}

function Hero({
  snapshot,
  variant,
  title,
  publicResumeUrl,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
  publicResumeUrl?: string;
}) {
  const { profile } = snapshot.data;
  const hasImage = Boolean(safeCloudinaryUrl(profile.heroImageUrl));

  if (variant === "terminal") {
    return (
      <section className="p-section hero-terminal">
        <div className="terminal-window">
          <div className="terminal-dots"><span /><span /><span /></div>
          <p>
            <span className="terminal-prompt">$</span>{" "}
            whoami
          </p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="terminal-role">{display(profile.role, "Your role")}</p>
          <p><span className="terminal-prompt">$</span> cat mission.txt</p>
          <p className="terminal-tagline">{display(profile.tagline, "Tell people what you build and why it matters.")}</p>
          <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
        </div>
      </section>
    );
  }

  if (variant === "cover" || variant === "glass") {
    return (
      <section className={`p-section hero-media hero-${variant} ${hasImage ? "has-image" : ""}`}>
        <HeroImage url={profile.heroImageUrl} name={profile.name} priority />
        <div className="hero-media-overlay" />
        <div className="hero-media-content">
          <p className="eyebrow">{heroLabel(title, profile.role)}</p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="hero-copy">{display(profile.tagline, "A concise statement about the work you want to be known for.")}</p>
          <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
          <div className="hero-media-meta">
            <span>{display(profile.location, "Your location")}</span>
            <span>{display(profile.availability, "Open to opportunities")}</span>
          </div>
        </div>
      </section>
    );
  }

  if (["image-split", "portrait", "editorial-photo"].includes(variant)) {
    return (
      <section className={`p-section hero-photo hero-${variant}`}>
        <div className="hero-photo-copy">
          <p className="eyebrow">{heroLabel(title, profile.role)}</p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="hero-copy">{display(profile.tagline, "A concise statement about the work you want to be known for.")}</p>
          <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
          <div className="hero-photo-meta">
            <span>{display(profile.location, "Your location")}</span>
            <span>{display(profile.availability, "Open to opportunities")}</span>
          </div>
        </div>
        <div className="hero-photo-frame">
          <HeroImage url={profile.heroImageUrl} name={profile.name} priority />
        </div>
      </section>
    );
  }

  if (variant === "poster") {
    return (
      <section className="p-section hero-poster">
        <div className="poster-topline">
          <span>{heroLabel(title, profile.role)}</span>
          <span>{display(profile.availability, "Open to opportunities")}</span>
        </div>
        <h1>{display(profile.name, "Your name")}</h1>
        {hasImage && (
          <div className="poster-media">
            <HeroImage url={profile.heroImageUrl} name={profile.name} priority />
          </div>
        )}
        <div className="poster-bottom">
          <p>{display(profile.tagline, "A concise statement about your work.")}</p>
          <div>
            <span>{display(profile.location, "Your location")}</span>
            <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
          </div>
        </div>
      </section>
    );
  }

  if (variant === "spotlight") {
    return (
      <section className="p-section hero-spotlight">
        <div className="spotlight-content">
          <p className="eyebrow">{heroLabel(title, profile.role)}</p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="hero-copy">{display(profile.tagline, "A concise statement about your work.")}</p>
          <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
          <div className="spotlight-meta">
            <span>{display(profile.location, "Your location")}</span>
            <span>{display(profile.availability, "Open to opportunities")}</span>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section className="p-section hero-minimal">
        <p className="eyebrow">{heroLabel(title, profile.role)}</p>
        <h1>{display(profile.name, "Your name")}</h1>
        <p className="hero-copy">{display(profile.tagline, "A concise statement about your work.")}</p>
        <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
      </section>
    );
  }

  return (
    <section className="p-section hero-split">
      <div>
        <p className="eyebrow">{heroLabel(title, profile.role)}</p>
        <h1>{display(profile.name, "Your name")}</h1>
        <p className="hero-copy">{display(profile.tagline, "A concise statement about your work.")}</p>
        <HeroActions snapshot={snapshot} publicResumeUrl={publicResumeUrl} />
      </div>
      <aside className="hero-card">
        <span className="status-dot" />
        <p>{display(profile.availability, "Open to opportunities")}</p>
        <div className="hero-meta">
          <span>{display(profile.location, "Your location")}</span>
          {profile.email ? (
            <a
              href={`mailto:${profile.email}`}
              data-analytics-event="contact_clicked"
              data-analytics-target="email"
            >
              {profile.email}
            </a>
          ) : (
            <span>your@email.com</span>
          )}
        </div>
      </aside>
    </section>
  );
}


function HeroActions({
  snapshot,
  publicResumeUrl,
}: {
  snapshot: PortfolioSnapshot;
  publicResumeUrl?: string;
}) {
  const resume = snapshot.meta?.resume;
  const resumeUrl = safeResumeUrl(publicResumeUrl || resume?.url);
  const showResume = Boolean(resume?.showInHero && resume?.url && resumeUrl);

  return (
    <div className="hero-actions">
      <Socials snapshot={snapshot} />
      {showResume && resumeUrl ? (
        <ResumeModalLauncher
          url={resumeUrl}
          fileName={resume?.fileName || "Resume.pdf"}
        />
      ) : null}
    </div>
  );
}

function HeroImage({
  url,
  name,
  priority = false,
}: {
  url?: string;
  name?: string;
  priority?: boolean;
}) {
  const src = safeCloudinaryUrl(url);

  // No photo yet: show the person's initials rather than an "upload" prompt,
  // which would otherwise appear on the published page.
  if (!src) {
    return (
      <div className="media-placeholder media-monogram" aria-hidden="true">
        <span>{initials(name)}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(max-width: 900px) 100vw, 50vw"
      priority={priority}
    />
  );
}

function Socials({ snapshot }: { snapshot: PortfolioSnapshot }) {
  return (
    <div className="social-row">
      {snapshot.data.profile.socials.map((social, index) => {
        const href = safeExternalUrl(social.url);
        if (!href) return null;

        return (
          <a
            key={`${social.label}-${index}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            data-analytics-event="social_clicked"
            data-analytics-target={analyticsSocialTarget(social.label, href)}
          >
            {social.label} ↗
          </a>
        );
      })}
    </div>
  );
}

function About({
  snapshot,
  variant,
  title,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
}) {
  const { profile } = snapshot.data;
  const story = display(profile.about, "Write a short story about your work, strengths, and what you care about.");

  return (
    <section className={`p-section about-layout about-v-${variant}`}>
      <SectionHeading index="01" title={sectionDisplayTitle("about", title)} />
      <div className="about-layout-grid">
        <div className="about-story">
          {variant === "quote" && <span className="about-quote-mark">“</span>}
          <p>{story}</p>
        </div>
        <div className="about-side">
          {(variant === "stats" || variant === "facts") && (
            <div className="stats-grid">
              <div><strong>{snapshot.data.projects.length}</strong><span>Selected projects</span></div>
              <div><strong>{snapshot.data.experience.length}</strong><span>Career chapters</span></div>
              <div><strong>{snapshot.data.skills.length}</strong><span>Core skills</span></div>
            </div>
          )}
          {!["stats", "facts"].includes(variant) && (
            <div className="about-facts">
              <div><span>Based in</span><strong>{display(profile.location, "Your location")}</strong></div>
              <div><span>Focus</span><strong>{display(profile.role, "Your role")}</strong></div>
              <div><span>Now</span><strong>{display(profile.availability, "Open to opportunities")}</strong></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Experience({
  snapshot,
  variant,
  title,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
}) {
  const items = snapshot.data.experience;

  return (
    <section className={`p-section experience-layout experience-v-${variant}`}>
      <SectionHeading index="02" title={sectionDisplayTitle("experience", title)} />
      {items.length ? (
        <div className="experience-layout-list">
          {items.map((item, index) => (
            <article key={item.id} className="experience-layout-item">
              <div className="experience-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="experience-period">{item.period}</div>
              <div className="experience-role">
                <h3>{item.role}</h3>
                <h4>{item.company}</h4>
              </div>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptySection message="Add experience to tell your career story." />
      )}
    </section>
  );
}

function Projects({
  snapshot,
  variant,
  title,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
}) {
  const projects = snapshot.data.projects;

  if (!projects.length) {
    return (
      <section className="p-section">
        <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
        <EmptySection message="Add projects to showcase your strongest work." />
      </section>
    );
  }

  if (variant === "list") {
    return (
      <section className="p-section projects-list-layout">
        <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
        <div className="project-list">
          {projects.map((project, index) => (
            <article key={project.id} className="project-list-row">
              <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              <ProjectActions project={project} compact />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "github") {
    return (
      <section className="p-section projects-github-layout">
        <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
        <div className="github-project-grid">
          {projects.map((project) => (
            <article key={project.id} className="github-project-card">
              <div className="github-project-head">
                <span className="repo-icon">&lt;/&gt;</span>
                <span>repository</span>
              </div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="tag-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
              <ProjectActions project={project} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "browser") {
    return (
      <section className="p-section projects-browser-layout">
        <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
        <div className="browser-project-list">
          {projects.map((project) => (
            <article key={project.id} className="browser-project-card">
              <div className="browser-chrome"><span /><span /><span /><em>{project.liveUrl || project.githubUrl || project.title}</em></div>
              <ProjectMedia project={project} />
              <div className="browser-project-copy">
                <div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
                <ProjectActions project={project} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "gallery") {
    return (
      <section className="p-section projects-gallery-layout">
        <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
        <div className="project-gallery">
          {projects.map((project, index) => (
            <article key={project.id} className="project-gallery-item">
              <ProjectMedia project={project} />
              <div className="project-gallery-overlay">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{project.title}</h3>
                <ProjectActions project={project} compact />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "showcase") {
    return (
      <section className="p-section">
        <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
        <div className="project-showcase">
          {projects.map((project, index) => (
            <article key={project.id} className="project-showcase-card">
              <div className="showcase-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="showcase-copy">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tag-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
              </div>
              <ProjectActions project={project} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  const imageFirst = ["image-grid", "image-bento"].includes(variant);
  const gridClass =
    variant === "bento"
      ? "project-grid project-bento"
      : variant === "mosaic"
        ? "project-grid project-mosaic"
        : variant === "image-bento"
          ? "project-grid project-image-bento"
          : variant === "image-grid"
            ? "project-grid project-image-grid"
            : "project-grid";

  return (
    <section className={`p-section projects-layout projects-${variant}`}>
      <SectionHeading index="03" title={sectionDisplayTitle("projects", title)} />
      <div className={gridClass}>
        {projects.map((project, index) => (
          <article key={project.id} className={`project-card project-${index + 1}`}>
            {imageFirst && <ProjectMedia project={project} />}
            <div className="project-card-copy">
              <p className="muted">Project / {String(index + 1).padStart(2, "0")}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
            <div className="project-footer">
              <div className="tag-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
              <ProjectActions project={project} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectMedia({ project }: { project: Project }) {
  const src = safeCloudinaryUrl(project.imageUrl);

  return (
    <div className={`project-media ${src ? "has-image" : ""}`}>
      {src ? (
        <Image
          src={src}
          alt={project.title}
          fill
          sizes="(max-width: 800px) 100vw, 50vw"
        />
      ) : (
        <div className="media-placeholder">
          <span>{project.title}</span>
        </div>
      )}
    </div>
  );
}

function ProjectActions({ project, compact = false }: { project: Project; compact?: boolean }) {
  const github = safeExternalUrl(project.githubUrl);
  const live = safeExternalUrl(project.liveUrl);

  if (!github && !live) return <span className="project-no-links">—</span>;

  return (
    <div className={`project-actions ${compact ? "compact" : ""}`}>
      {github && (
        <a
          href={github}
          target="_blank"
          rel="noreferrer"
          data-analytics-event="project_clicked"
          data-analytics-target="project:github"
        >
          GitHub ↗
        </a>
      )}
      {live && (
        <a
          href={live}
          target="_blank"
          rel="noreferrer"
          data-analytics-event="project_clicked"
          data-analytics-target="project:live"
        >
          Live ↗
        </a>
      )}
    </div>
  );
}

function Skills({
  snapshot,
  variant,
  title,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
}) {
  const skills = snapshot.data.skills;
  const logoVariant = ["logos", "logo-grid"].includes(variant);

  return (
    <section className={`p-section skills-layout skills-v-${variant}`}>
      <SectionHeading index="04" title={sectionDisplayTitle("skills", title)} />
      {skills.length ? (
        <div className={`skills-layout-list ${logoVariant ? "with-logos" : ""}`}>
          {skills.map((skill, index) => (
            <div key={skill} className="skill-item">
              {logoVariant && <SkillLogo skill={skill} />}
              <span className="skill-index">{String(index + 1).padStart(2, "0")}</span>
              <strong>{skill}</strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptySection message="Add skills to build your capability section." />
      )}
    </section>
  );
}

function Resume({
  snapshot,
  variant,
  title,
  publicResumeUrl,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
  publicResumeUrl?: string;
}) {
  const resume = snapshot.meta?.resume;
  const url = safeResumeUrl(publicResumeUrl || resume?.url);
  if (!resume || !url) return null;

  const fileName = resume.fileName.trim() || "Resume.pdf";
  const heading = sectionDisplayTitle("resume", title);
  const targetRole =
    snapshot.meta?.targetRole?.trim() ||
    snapshot.data.profile.role.trim() ||
    "Professional profile";
  const profileName = snapshot.data.profile.name.trim() || "Portfolio";
  // A visitor gains nothing from the upload's file name, and a long one used
  // to break out of its card. Name the document instead. The real file name
  // still reaches the download and the preview dialog.
  const documentLabel = `${profileName} — résumé`;

  if (variant === "card") {
    return (
      <section className="p-section resume-section resume-v-card">
        <SectionHeading index="05" title={heading} />
        <div className="resume-card">
          <div>
            <span className="resume-file-type">PDF</span>
            <h3>{documentLabel}</h3>
            <p>View the complete résumé in a new tab.</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            data-analytics-event="resume_opened"
            data-analytics-target="resume"
          >
            Open resume ↗
          </a>
        </div>
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <section className="p-section resume-section resume-v-compact">
        <SectionHeading index="05" title={heading} />
        <div className="resume-compact-row">
          <div>
            <span className="resume-file-type">PDF</span>
            <strong>{documentLabel}</strong>
          </div>
          <span>{targetRole}</span>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="View résumé"
            className="resume-inline-action"
          />
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className="p-section resume-section resume-v-split">
        <SectionHeading index="05" title={heading} />
        <div className="resume-split-panel">
          <div className="resume-split-copy">
            <p className="eyebrow">Experience / skills / impact</p>
            <h3>The detailed version of {profileName}&apos;s work.</h3>
            <p>
              Open the full résumé for the complete professional timeline,
              responsibilities, and technical background.
            </p>
          </div>
          <div className="resume-document-card">
            <span className="resume-document-icon" aria-hidden="true">
              PDF
            </span>
            <div>
              <strong>{documentLabel}</strong>
              <small>{targetRole}</small>
            </div>
            <ResumeModalLauncher
              url={url}
              fileName={fileName}
              label="View document ↗"
              className="resume-document-action"
            />
          </div>
        </div>
      </section>
    );
  }

  if (variant === "spotlight") {
    return (
      <section className="p-section resume-section resume-v-spotlight">
        <div className="resume-spotlight-panel">
          <span className="resume-spotlight-index">05 / Résumé</span>
          <h2>{heading}</h2>
          <p>{targetRole}</p>
          <strong>{documentLabel}</strong>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="Read the full résumé"
            className="resume-spotlight-action"
          />
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section className="p-section resume-section resume-v-minimal">
        <div className="resume-minimal-row">
          <div>
            <span>05</span>
            <h2>{heading}</h2>
          </div>
          <p>{documentLabel}</p>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="View PDF ↗"
            className="resume-minimal-action"
          />
        </div>
      </section>
    );
  }

  if (variant === "terminal") {
    return (
      <section className="p-section resume-section resume-v-terminal">
        <SectionHeading index="05" title={heading} />
        <div className="terminal-window resume-terminal-window">
          <p>
            <span className="terminal-prompt">$</span> open resume.pdf
          </p>
          <p className="resume-terminal-file">{documentLabel}</p>
          <p>
            <span className="terminal-prompt">role:</span> {targetRole}
          </p>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="view --resume ↗"
            className="resume-terminal-action"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="p-section resume-section resume-v-embed">
      <div className="resume-section-head">
        <SectionHeading index="05" title={heading} />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          data-analytics-event="resume_opened"
          data-analytics-target="resume"
        >
          Open PDF ↗
        </a>
      </div>
      <div className="resume-frame">
        <iframe
          src={url}
          title={`${snapshot.data.profile.name || "Portfolio"} resume`}
          loading="lazy"
        />
      </div>
    </section>
  );
}

function Contact({
  snapshot,
  variant,
  title,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
}) {
  const { profile } = snapshot.data;
  const email = profile.email || "your@email.com";

  if (variant === "terminal") {
    return (
      <footer className="p-section contact-terminal">
        <div className="terminal-window">
          <p><span className="terminal-prompt">$</span> {sectionDisplayTitle("contact", title).toLowerCase()} --next</p>
          <h2>{email}</h2>
          <p>{display(profile.availability, "Open to opportunities")}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`p-section contact-layout contact-v-${variant}`}>
      <div className="contact-copy">
        <p className="eyebrow">{sectionDisplayTitle("contact", title)}</p>
        <h2>{variant === "minimal" || variant === "compact" ? "Get in touch." : "Open to the next hard problem."}</h2>
        <p>{display(profile.availability, "Open to opportunities")}</p>
      </div>
      <div className="contact-actions">
        <a
          className="contact-button"
          href={`mailto:${email}`}
          data-analytics-event="contact_clicked"
          data-analytics-target="email"
        >
          {email} ↗
        </a>
        <Socials snapshot={snapshot} />
      </div>
    </footer>
  );
}

function CustomSectionBlock({
  snapshot,
  section,
}: {
  snapshot: PortfolioSnapshot;
  section: SectionConfig;
}) {
  const custom = snapshot.data.customSections.find(
    (item) => item.id === section.customSectionId
  );
  if (!custom) return null;

  const items = custom.items.filter((item) =>
    [
      item.heading,
      item.subheading,
      item.meta,
      item.description,
      item.linkLabel,
      item.linkUrl,
    ].some((value) => value.trim())
  );
  if (!items.length) return null;

  const title = section.title?.trim() || custom.title || "Custom section";

  if (section.variant === "cards") {
    return (
      <section className="p-section custom-section custom-v-cards">
        <SectionHeading index="+" title={title} />
        <div className="custom-card-grid">
          {items.map((item) => (
            <article className="custom-card" key={item.id}>
              {item.meta ? <span className="custom-meta">{item.meta}</span> : null}
              <div>
                {item.heading ? <h3>{item.heading}</h3> : null}
                {item.subheading ? <h4>{item.subheading}</h4> : null}
                {item.description ? <p>{item.description}</p> : null}
              </div>
              <CustomItemLink item={item} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.variant === "timeline") {
    return (
      <section className="p-section custom-section custom-v-timeline">
        <SectionHeading index="+" title={title} />
        <div className="custom-timeline">
          {items.map((item) => (
            <article className="custom-timeline-item" key={item.id}>
              <span className="custom-timeline-dot" aria-hidden="true" />
              <div className="custom-timeline-meta">{item.meta}</div>
              <div className="custom-timeline-copy">
                {item.heading ? <h3>{item.heading}</h3> : null}
                {item.subheading ? <h4>{item.subheading}</h4> : null}
                {item.description ? <p>{item.description}</p> : null}
                <CustomItemLink item={item} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.variant === "grid") {
    return (
      <section className="p-section custom-section custom-v-grid">
        <SectionHeading index="+" title={title} />
        <div className="custom-grid">
          {items.map((item) => (
            <article className="custom-grid-item" key={item.id}>
              {item.meta ? <span className="custom-meta">{item.meta}</span> : null}
              {item.heading ? <h3>{item.heading}</h3> : null}
              {item.subheading ? <h4>{item.subheading}</h4> : null}
              {item.description ? <p>{item.description}</p> : null}
              <CustomItemLink item={item} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.variant === "compact") {
    return (
      <section className="p-section custom-section custom-v-compact">
        <SectionHeading index="+" title={title} />
        <div className="custom-compact">
          {items.map((item) => (
            <article className="custom-compact-row" key={item.id}>
              <span>{item.meta}</span>
              <div>
                {item.heading ? <h3>{item.heading}</h3> : null}
                {item.subheading ? <h4>{item.subheading}</h4> : null}
              </div>
              {item.description ? <p>{item.description}</p> : null}
              <CustomItemLink item={item} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.variant === "split") {
    return (
      <section className="p-section custom-section custom-v-split">
        <SectionHeading index="+" title={title} />
        <div className="custom-split">
          {items.map((item, index) => (
            <article className="custom-split-item" key={item.id}>
              <div className="custom-split-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.meta ? <strong>{item.meta}</strong> : null}
              </div>
              <div className="custom-split-copy">
                {item.heading ? <h3>{item.heading}</h3> : null}
                {item.subheading ? <h4>{item.subheading}</h4> : null}
                {item.description ? <p>{item.description}</p> : null}
                <CustomItemLink item={item} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.variant === "spotlight") {
    const [featured, ...rest] = items;
    return (
      <section className="p-section custom-section custom-v-spotlight">
        <SectionHeading index="+" title={title} />
        <article className="custom-spotlight-feature">
          {featured.meta ? <span className="custom-meta">{featured.meta}</span> : null}
          {featured.heading ? <h3>{featured.heading}</h3> : null}
          {featured.subheading ? <h4>{featured.subheading}</h4> : null}
          {featured.description ? <p>{featured.description}</p> : null}
          <CustomItemLink item={featured} />
        </article>
        {rest.length ? (
          <div className="custom-spotlight-list">
            {rest.map((item) => (
              <article key={item.id}>
                <div>
                  {item.heading ? <h3>{item.heading}</h3> : null}
                  {item.subheading ? <h4>{item.subheading}</h4> : null}
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                {item.meta ? <span>{item.meta}</span> : null}
                <CustomItemLink item={item} />
              </article>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  if (section.variant === "badges") {
    return (
      <section className="p-section custom-section custom-v-badges">
        <SectionHeading index="+" title={title} />
        <div className="custom-badges">
          {items.map((item) => (
            <article className="custom-badge" key={item.id}>
              <div>
                {item.heading || item.description ? (
                  <strong>{item.heading || item.description}</strong>
                ) : null}
                {item.subheading || (item.heading && item.description) ? (
                  <span>{item.subheading || item.description}</span>
                ) : null}
              </div>
              {item.meta ? <small>{item.meta}</small> : null}
              <CustomItemLink item={item} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="p-section custom-section custom-v-list">
      <SectionHeading index="+" title={title} />
      <div className="custom-list">
        {items.map((item) => (
          <article className="custom-list-row" key={item.id}>
            <div className="custom-list-meta">{item.meta}</div>
            <div className="custom-list-copy">
              {item.heading ? <h3>{item.heading}</h3> : null}
              {item.subheading ? <h4>{item.subheading}</h4> : null}
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <CustomItemLink item={item} />
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomItemLink({
  item,
}: {
  item: PortfolioSnapshot["data"]["customSections"][number]["items"][number];
}) {
  const href = safeExternalUrl(item.linkUrl);
  if (!href) return null;

  return (
    <a
      className="custom-item-link"
      href={href}
      target="_blank"
      rel="noreferrer"
      data-analytics-event="custom_link_clicked"
      data-analytics-target="custom:link"
    >
      {item.linkLabel.trim() || "Open"} ↗
    </a>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="empty-portfolio-section">
      <span>Empty section</span>
      <p>{message}</p>
    </div>
  );
}

// The "01 / 02" counters were decoration that read as a template; the index
// prop stays so callers do not change.
function SectionHeading({ title }: { index: string; title: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
    </div>
  );
}

// Visitors need the role, not the portfolio's internal name ("Backend &
// Platform / Backend & Platform Engineer" said the same thing twice). The hero
// title only fills in when no role is set.
function heroLabel(title: string | undefined, role: string) {
  return display(role, sectionDisplayTitle("hero", title));
}

function safeResumeUrl(value?: string) {
  if (!value) return null;
  if (
    value.startsWith("/api/public-resume/") ||
    value.startsWith("/api/resume/")
  ) {
    return value;
  }
  return safeCloudinaryUrl(value);
}

function safeCloudinaryUrl(value?: string) {
  const url = safeExternalUrl(value);
  if (!url) return null;

  try {
    return new URL(url).hostname === "res.cloudinary.com" ? url : null;
  } catch {
    return null;
  }
}

function safeExternalUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function initials(name?: string) {
  const letters = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "·";
}

function display(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}
