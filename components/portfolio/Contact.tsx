import { sectionDisplayTitle } from "@/lib/portfolio";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { Socials, display } from "./SectionElements";

export function Contact({
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
