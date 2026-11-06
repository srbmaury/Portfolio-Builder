import Image from "next/image";
import { sectionDisplayTitle } from "@/lib/portfolio";
import type { PortfolioSnapshot, Project } from "@/lib/portfolio";
import { splitProjectDescription } from "@/lib/portfolio-prose";
import { EmptySection, PortfolioText, SectionHeading } from "./SectionElements";
import { safeCloudinaryUrl, safeExternalUrl } from "./safeUrls";

export function Projects({
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
        <SectionHeading title={sectionDisplayTitle("projects", title)} />
        <EmptySection message="Add projects to showcase your strongest work." />
      </section>
    );
  }

  if (variant === "list") {
    return (
      <section className="p-section projects-list-layout">
        <SectionHeading title={sectionDisplayTitle("projects", title)} />
        <div className="project-list">
          {projects.map((project, index) => (
            <article key={project.id} className="project-list-row">
              <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{project.title}</h3>
                <ProjectDescription project={project} />
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
        <SectionHeading title={sectionDisplayTitle("projects", title)} />
        <div className="github-project-grid">
          {projects.map((project) => (
            <article key={project.id} className="github-project-card">
              <div className="github-project-head">
                <span className="repo-icon">&lt;/&gt;</span>
                <span>repository</span>
              </div>
              <h3>{project.title}</h3>
              <ProjectDescription project={project} />
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
        <SectionHeading title={sectionDisplayTitle("projects", title)} />
        <div className="browser-project-list">
          {projects.map((project) => (
            <article key={project.id} className="browser-project-card">
              <div className="browser-chrome"><span /><span /><span /><em>{project.liveUrl || project.githubUrl || project.title}</em></div>
              <ProjectMedia project={project} />
              <div className="browser-project-copy">
                <div>
                  <h3>{project.title}</h3>
                  <ProjectDescription project={project} />
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
        <SectionHeading title={sectionDisplayTitle("projects", title)} />
        <div className="project-gallery">
          {projects.map((project, index) => (
            <article key={project.id} className="project-gallery-item">
              <div className="project-gallery-stage">
              <ProjectMedia project={project} />
              <div className="project-gallery-overlay">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{project.title}</h3>
                <ProjectActions project={project} compact />
              </div>
              </div>
              <div className="project-gallery-story"><ProjectDescription project={project} /></div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "showcase") {
    return (
      <section className="p-section">
        <SectionHeading title={sectionDisplayTitle("projects", title)} />
        <div className="project-showcase">
          {projects.map((project, index) => (
            <article key={project.id} className="project-showcase-card">
              <div className="showcase-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="showcase-copy">
                <h3>{project.title}</h3>
                <ProjectDescription project={project} />
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
      <SectionHeading title={sectionDisplayTitle("projects", title)} />
      <div className={gridClass}>
        {projects.map((project, index) => (
          <article key={project.id} className={`project-card project-${index + 1}`}>
            {imageFirst && <ProjectMedia project={project} />}
            <div className="project-card-copy">
              <p className="muted">Project / {String(index + 1).padStart(2, "0")}</p>
              <h3>{project.title}</h3>
              <ProjectDescription project={project} />
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

function ProjectDescription({ project }: { project: Project }) {
  const { overview, details } = splitProjectDescription(project.description);
  return <div className="project-description">
    <PortfolioText text={overview} />
    {details.trim() && <details className="project-details">
      <summary aria-label={`Read case study for ${project.title}`}>
        <span>Read case study</span><span className="case-study-toggle" aria-hidden="true">+</span>
      </summary>
      <PortfolioText text={details} />
    </details>}
  </div>;
}
