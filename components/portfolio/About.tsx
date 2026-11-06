import { sectionDisplayTitle } from "@/lib/portfolio";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { PortfolioText, SectionHeading, display } from "./SectionElements";

export function About({
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
      <SectionHeading title={sectionDisplayTitle("about", title)} />
      <div className="about-layout-grid">
        <div className="about-story">
          {variant === "quote" && <span className="about-quote-mark">“</span>}
          <PortfolioText text={story} />
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
