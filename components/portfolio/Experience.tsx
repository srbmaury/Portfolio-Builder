import { sectionDisplayTitle } from "@/lib/portfolio";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { EmptySection, PortfolioText, SectionHeading } from "./SectionElements";

export function Experience({
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
      <SectionHeading title={sectionDisplayTitle("experience", title)} />
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
              <PortfolioText text={item.summary} className="experience-summary" />
            </article>
          ))}
        </div>
      ) : (
        <EmptySection message="Add experience to tell your career story." />
      )}
    </section>
  );
}
