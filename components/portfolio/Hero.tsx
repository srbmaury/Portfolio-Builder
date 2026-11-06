import Image from "next/image";
import { sectionDisplayTitle, sectionHasContent, sectionType } from "@/lib/portfolio";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { ResumeModalLauncher } from "@/components/ResumeModalLauncher";
import { portfolioSectionAnchor } from "./PortfolioNavigation";
import { Socials, display } from "./SectionElements";
import { safeResumeUrl, safeCloudinaryUrl } from "./safeUrls";

export function Hero({
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
  const projectsSection = snapshot.config.sections.find(
    (section) => section.visible && sectionType(section) === "projects" &&
      sectionHasContent(section, snapshot.data, resume)
  );

  return (
    <div className="hero-actions">
      {projectsSection ? (
        <a className="hero-work-link" href={`#${portfolioSectionAnchor(projectsSection)}`}>
          Explore my work <span aria-hidden="true">↗</span>
        </a>
      ) : null}
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

// Visitors need the role, not the portfolio's internal name ("Backend &
// Platform / Backend & Platform Engineer" said the same thing twice). The hero
// title only fills in when no role is set.
function heroLabel(title: string | undefined, role: string) {
  return display(role, sectionDisplayTitle("hero", title));
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
