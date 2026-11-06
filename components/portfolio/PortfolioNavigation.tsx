import { MobilePortfolioNavigation } from "@/components/MobilePortfolioNavigation";
import { sectionDisplayTitle, sectionType } from "@/lib/portfolio";
import type { PortfolioSnapshot, SectionConfig } from "@/lib/portfolio";

export function PortfolioNavigation({
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

        <MobilePortfolioNavigation items={items} />
        <div className="portfolio-nav-links">
          {items.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </div>
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

export function portfolioSectionAnchor(section: SectionConfig) {
  const safe = section.id
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `portfolio-section-${safe || "section"}`;
}
