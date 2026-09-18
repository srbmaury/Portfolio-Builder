import type { PortfolioSnapshot, SectionConfig } from "@/lib/portfolio";

type Props = {
  snapshot: PortfolioSnapshot;
  compact?: boolean;
};

export function PortfolioRenderer({ snapshot, compact = false }: Props) {
  const { data, config } = snapshot;

  return (
    <main className={`portfolio theme-${config.theme} ${compact ? "portfolio-compact" : ""}`}>
      <div className="portfolio-frame">
        {config.sections
          .filter((section) => section.visible)
          .map((section) => (
            <PortfolioSection
              key={section.id}
              section={section}
              snapshot={snapshot}
            />
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
  switch (section.id) {
    case "hero":
      return <Hero snapshot={snapshot} variant={section.variant} />;
    case "about":
      return <About snapshot={snapshot} variant={section.variant} />;
    case "experience":
      return <Experience snapshot={snapshot} variant={section.variant} />;
    case "projects":
      return <Projects snapshot={snapshot} variant={section.variant} />;
    case "skills":
      return <Skills snapshot={snapshot} variant={section.variant} />;
    case "contact":
      return <Contact snapshot={snapshot} variant={section.variant} />;
  }
}

function Hero({ snapshot, variant }: { snapshot: PortfolioSnapshot; variant: string }) {
  const { profile } = snapshot.data;

  if (variant === "terminal") {
    return (
      <section className="p-section hero-terminal">
        <div className="terminal-window">
          <div className="terminal-dots"><span /><span /><span /></div>
          <p><span className="terminal-prompt">$</span> whoami</p>
          <h1>{profile.name}</h1>
          <p className="terminal-role">{profile.role}</p>
          <p><span className="terminal-prompt">$</span> cat mission.txt</p>
          <p className="terminal-tagline">{profile.tagline}</p>
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section className="p-section hero-minimal">
        <p className="eyebrow">{profile.role}</p>
        <h1>{profile.name}</h1>
        <p className="hero-copy">{profile.tagline}</p>
        <Socials snapshot={snapshot} />
      </section>
    );
  }

  return (
    <section className="p-section hero-split">
      <div>
        <p className="eyebrow">Portfolio / {profile.role}</p>
        <h1>{profile.name}</h1>
        <p className="hero-copy">{profile.tagline}</p>
        <Socials snapshot={snapshot} />
      </div>
      <aside className="hero-card">
        <span className="status-dot" />
        <p>{profile.availability}</p>
        <div className="hero-meta">
          <span>{profile.location}</span>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
      </aside>
    </section>
  );
}

function Socials({ snapshot }: { snapshot: PortfolioSnapshot }) {
  return (
    <div className="social-row">
      {snapshot.data.profile.socials.map((social) => (
        <a key={social.label} href={social.url} target="_blank" rel="noreferrer">
          {social.label} ↗
        </a>
      ))}
    </div>
  );
}

function About({ snapshot, variant }: { snapshot: PortfolioSnapshot; variant: string }) {
  const { profile } = snapshot.data;

  if (variant === "stats") {
    return (
      <section className="p-section">
        <SectionHeading index="01" title="About" />
        <div className="about-stats">
          <p>{profile.about}</p>
          <div className="stats-grid">
            <div><strong>{snapshot.data.projects.length}</strong><span>Selected projects</span></div>
            <div><strong>{snapshot.data.experience.length}</strong><span>Career chapters</span></div>
            <div><strong>{snapshot.data.skills.length}</strong><span>Core skills</span></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-section">
      <SectionHeading index="01" title="About" />
      <div className="editorial-copy">
        <p>{profile.about}</p>
      </div>
    </section>
  );
}

function Experience({ snapshot, variant }: { snapshot: PortfolioSnapshot; variant: string }) {
  const items = snapshot.data.experience;
  return (
    <section className="p-section">
      <SectionHeading index="02" title="Experience" />
      {variant === "cards" ? (
        <div className="experience-cards">
          {items.map((item) => (
            <article key={`${item.company}-${item.period}`} className="experience-card">
              <p className="muted">{item.period}</p>
              <h3>{item.role}</h3>
              <h4>{item.company}</h4>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="timeline">
          {items.map((item) => (
            <article key={`${item.company}-${item.period}`} className="timeline-item">
              <div className="timeline-marker" />
              <div>
                <p className="muted">{item.period}</p>
                <h3>{item.role} · {item.company}</h3>
                <p>{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Projects({ snapshot, variant }: { snapshot: PortfolioSnapshot; variant: string }) {
  const projects = snapshot.data.projects;

  if (variant === "list") {
    return (
      <section className="p-section">
        <SectionHeading index="03" title="Selected work" />
        <div className="project-list">
          {projects.map((project, index) => (
            <a key={project.title} className="project-list-row" href={project.url || "#"} target="_blank" rel="noreferrer">
              <span className="project-number">0{index + 1}</span>
              <div><h3>{project.title}</h3><p>{project.description}</p></div>
              <span>↗</span>
            </a>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="p-section">
      <SectionHeading index="03" title="Selected work" />
      <div className={variant === "bento" ? "project-grid project-bento" : "project-grid"}>
        {projects.map((project, index) => (
          <article key={project.title} className={`project-card project-${index + 1}`}>
            <div>
              <p className="muted">Project / 0{index + 1}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
            <div className="project-footer">
              <div className="tag-row">
                {project.stack.map((item) => <span key={item}>{item}</span>)}
              </div>
              {project.url && <a href={project.url} target="_blank" rel="noreferrer">View ↗</a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Skills({ snapshot, variant }: { snapshot: PortfolioSnapshot; variant: string }) {
  const skills = snapshot.data.skills;

  return (
    <section className="p-section">
      <SectionHeading index="04" title="Capabilities" />
      {variant === "columns" ? (
        <div className="skill-columns">
          {skills.map((skill, index) => (
            <div key={skill}><span>0{index + 1}</span><strong>{skill}</strong></div>
          ))}
        </div>
      ) : (
        <div className="skill-cloud">
          {skills.map((skill) => <span key={skill}>{skill}</span>)}
        </div>
      )}
    </section>
  );
}

function Contact({ snapshot, variant }: { snapshot: PortfolioSnapshot; variant: string }) {
  const { profile } = snapshot.data;

  if (variant === "minimal") {
    return (
      <footer className="p-section contact-minimal">
        <p>Have something interesting in mind?</p>
        <a href={`mailto:${profile.email}`}>{profile.email} ↗</a>
      </footer>
    );
  }

  return (
    <footer className="p-section contact-panel">
      <p className="eyebrow">Let's build something useful</p>
      <h2>Open to the next hard problem.</h2>
      <p>{profile.availability}</p>
      <a className="contact-button" href={`mailto:${profile.email}`}>Start a conversation ↗</a>
    </footer>
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
