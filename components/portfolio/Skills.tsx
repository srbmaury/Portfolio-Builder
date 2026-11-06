import { sectionDisplayTitle } from "@/lib/portfolio";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { SkillLogo } from "@/components/SkillLogo";
import { EmptySection, SectionHeading } from "./SectionElements";

export function Skills({
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
      <SectionHeading title={sectionDisplayTitle("skills", title)} />
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
