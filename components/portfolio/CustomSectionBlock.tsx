import type { PortfolioSnapshot, SectionConfig } from "@/lib/portfolio";
import { SectionHeading } from "./SectionElements";
import { safeExternalUrl } from "./safeUrls";

export function CustomSectionBlock({
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
        <SectionHeading title={title} />
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
        <SectionHeading title={title} />
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
        <SectionHeading title={title} />
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
        <SectionHeading title={title} />
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
        <SectionHeading title={title} />
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
        <SectionHeading title={title} />
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
        <SectionHeading title={title} />
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
      <SectionHeading title={title} />
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
