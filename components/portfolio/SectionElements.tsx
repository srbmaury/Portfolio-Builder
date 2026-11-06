import type { PortfolioSnapshot } from "@/lib/portfolio";
import { parsePortfolioProse } from "@/lib/portfolio-prose";
import { analyticsSocialTarget } from "@/lib/analytics";
import { safeExternalUrl } from "./safeUrls";

export function Socials({ snapshot }: { snapshot: PortfolioSnapshot }) {
  return (
    <div className="social-row">
      {snapshot.data.profile.socials.map((social, index) => {
        const href = safeExternalUrl(social.url);
        if (!href) return null;

        return (
          <a
            key={`${social.label}-${index}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            data-analytics-event="social_clicked"
            data-analytics-target={analyticsSocialTarget(social.label, href)}
          >
            {social.label} ↗
          </a>
        );
      })}
    </div>
  );
}

export function PortfolioText({ text, className = "" }: { text: string; className?: string }) {
  return <div className={`portfolio-prose ${className}`}>
    {parsePortfolioProse(text).map((block, index) => {
      if (block.type === "list") return <ul key={index}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
      if (block.type === "heading") return <h4 key={index}>{block.text}</h4>;
      return <p key={index}>{block.text}</p>;
    })}
  </div>;
}

export function EmptySection({ message }: { message: string }) {
  return (
    <div className="empty-portfolio-section">
      <span>Empty section</span>
      <p>{message}</p>
    </div>
  );
}

export function SectionHeading({ title }: { title: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
    </div>
  );
}

export function display(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}
