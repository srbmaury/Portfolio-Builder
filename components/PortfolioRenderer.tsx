import Image from "next/image";
import {
  analyticsSocialTarget,
  analyticsTargetKey,
} from "@/lib/analytics";
import { skillIconUrl, skillInitials } from "@/lib/skill-icons";
import {
  sectionDisplayTitle,
  sectionHasContent,
  sectionType,
} from "@/lib/portfolio";
import type { PortfolioSnapshot, Project, SectionConfig } from "@/lib/portfolio";

type Props = {
  snapshot: PortfolioSnapshot;
  compact?: boolean;
};

export function PortfolioRenderer({ snapshot, compact = false }: Props) {
  const { config } = snapshot;

  return (
    <main className={`portfolio theme-${config.theme} ${compact ? "portfolio-compact" : ""}`}>
      <div className="portfolio-frame">
        {config.sections
          .filter(
            (section) =>
              section.visible &&
              sectionHasContent(section, snapshot.data, snapshot.meta?.resume)
          )
          .map((section) => (
            <PortfolioSection key={section.id} section={section} snapshot={snapshot} />
          ))}
      </div>
    </main>
  );
}

function PortfolioSection({
  section,
  snapshot,
}: {
  section: SectionConfig;
  snapshot: PortfolioSnapshot;
}) {
  switch (sectionType(section)) {
    case "hero":
      return <Hero snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "about":
      return <About snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "experience":
      return <Experience snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "projects":
      return <Projects snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "skills":
      return <Skills snapshot={snapshot} variant={section.variant} title={section.title} />;
    case "resume":
      return <Resume snapshot={snapshot} variant={section.variant} title={section.title} />;
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
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
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
            {title?.trim() ? `${title.trim().toLowerCase()} --whoami` : "whoami"}
          </p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="terminal-role">{display(profile.role, "Your role")}</p>
          <p><span className="terminal-prompt">$</span> cat mission.txt</p>
          <p className="terminal-tagline">{display(profile.tagline, "Tell people what you build and why it matters.")}</p>
        </div>
      </section>
    );
  }

  if (variant === "cover" || variant === "glass") {
    return (
      <section className={`p-section hero-media hero-${variant} ${hasImage ? "has-image" : ""}`}>
        <HeroImage url={profile.heroImageUrl} priority />
        <div className="hero-media-overlay" />
        <div className="hero-media-content">
          <p className="eyebrow">{heroLabel(title, profile.role)}</p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="hero-copy">{display(profile.tagline, "A concise statement about the work you want to be known for.")}</p>
          <Socials snapshot={snapshot} />
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
          <Socials snapshot={snapshot} />
          <div className="hero-photo-meta">
            <span>{display(profile.location, "Your location")}</span>
            <span>{display(profile.availability, "Open to opportunities")}</span>
          </div>
        </div>
        <div className="hero-photo-frame">
          <HeroImage url={profile.heroImageUrl} priority />
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
            <HeroImage url={profile.heroImageUrl} priority />
          </div>
        )}
        <div className="poster-bottom">
          <p>{display(profile.tagline, "A concise statement about your work.")}</p>
          <div>
            <span>{display(profile.location, "Your location")}</span>
            <Socials snapshot={snapshot} />
          </div>
        </div>
      </section>
    );
  }

  if (variant === "spotlight") {
    return (
      <section className="p-section hero-spotlight">
        <div className="spotlight-orb" aria-hidden="true" />
        <div className="spotlight-content">
          <p className="eyebrow">{heroLabel(title, profile.role)}</p>
          <h1>{display(profile.name, "Your name")}</h1>
          <p className="hero-copy">{display(profile.tagline, "A concise statement about your work.")}</p>
          <Socials snapshot={snapshot} />
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
        <Socials snapshot={snapshot} />
      </section>
    );
  }

  return (
    <section className="p-section hero-split">
      <div>
        <p className="eyebrow">
          {title?.trim() ? `${title.trim()} / ` : ""}{display(profile.role, "Your role")}
        </p>
        <h1>{display(profile.name, "Your name")}</h1>
        <p className="hero-copy">{display(profile.tagline, "A concise statement about your work.")}</p>
        <Socials snapshot={snapshot} />
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

function HeroImage({ url, priority = false }: { url?: string; priority?: boolean }) {
  const src = safeCloudinaryUrl(url);

  if (!src) {
    return (
      <div className="media-placeholder">
        <span>Upload a hero image</span>
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
      unoptimized
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
          unoptimized
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
          data-analytics-target={`${analyticsTargetKey(project.id)}:github`}
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
          data-analytics-target={`${analyticsTargetKey(project.id)}:live`}
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

function SkillLogo({ skill }: { skill: string }) {
  const url = skillIconUrl(skill);

  return (
    <span className="skill-logo">
      {url ? (
        <Image src={url} alt="" width={34} height={34} unoptimized />
      ) : (
        <span>{skillInitials(skill)}</span>
      )}
    </span>
  );
}

function Resume({
  snapshot,
  variant,
  title,
}: {
  snapshot: PortfolioSnapshot;
  variant: string;
  title?: string;
}) {
  const resume = snapshot.meta?.resume;
  const url = safeCloudinaryUrl(resume?.url);
  if (!resume || !url) return null;

  const fileName = resume.fileName.trim() || "Resume.pdf";
  const heading = sectionDisplayTitle("resume", title);

  if (variant === "card") {
    return (
      <section className="p-section resume-section resume-v-card">
        <SectionHeading index="05" title={heading} />
        <div className="resume-card">
          <div>
            <span className="resume-file-type">PDF</span>
            <h3>{fileName}</h3>
            <p>
              View the complete résumé in a new tab.
            </p>
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
      data-analytics-target={`custom:${analyticsTargetKey(item.id)}`}
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

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="section-heading">
      <span>{index}</span>
      <h2>{title}</h2>
    </div>
  );
}

function heroLabel(title: string | undefined, role: string) {
  const cleanTitle = sectionDisplayTitle("hero", title);
  const cleanRole = display(role, "Your role");
  return `${cleanTitle} / ${cleanRole}`;
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

function display(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}
