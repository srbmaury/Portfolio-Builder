import { About } from "@/components/portfolio/About";
import { Contact } from "@/components/portfolio/Contact";
import { CustomSectionBlock } from "@/components/portfolio/CustomSectionBlock";
import { Experience } from "@/components/portfolio/Experience";
import { Hero } from "@/components/portfolio/Hero";
import { PortfolioNavigation, portfolioSectionAnchor } from "@/components/portfolio/PortfolioNavigation";
import { Projects } from "@/components/portfolio/Projects";
import { Resume } from "@/components/portfolio/Resume";
import { Skills } from "@/components/portfolio/Skills";
import { sectionHasContent, sectionType } from "@/lib/portfolio";
import type { PortfolioSnapshot, SectionConfig } from "@/lib/portfolio";

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
