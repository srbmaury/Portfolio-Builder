import { sectionDisplayTitle } from "@/lib/portfolio";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { ResumeModalLauncher } from "@/components/ResumeModalLauncher";
import { SectionHeading } from "./SectionElements";
import { safeResumeUrl } from "./safeUrls";

export function Resume({
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
  const resume = snapshot.meta?.resume;
  const url = safeResumeUrl(publicResumeUrl || resume?.url);
  if (!resume || !url) return null;

  const fileName = resume.fileName.trim() || "Resume.pdf";
  const heading = sectionDisplayTitle("resume", title);
  const targetRole =
    snapshot.meta?.targetRole?.trim() ||
    snapshot.data.profile.role.trim() ||
    "Professional profile";
  const profileName = snapshot.data.profile.name.trim() || "Portfolio";
  // A visitor gains nothing from the upload's file name, and a long one used
  // to break out of its card. Name the document instead. The real file name
  // still reaches the download and the preview dialog.
  const documentLabel = `${profileName} — résumé`;

  if (variant === "card") {
    return (
      <section className="p-section resume-section resume-v-card">
        <SectionHeading title={heading} />
        <div className="resume-card">
          <div>
            <span className="resume-file-type">PDF</span>
            <h3>{documentLabel}</h3>
            <p>View the complete résumé in a new tab.</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            data-analytics-event="resume_opened"
            data-analytics-target="resume"
          >
            Open resume ↗
          </a>
        </div>
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <section className="p-section resume-section resume-v-compact">
        <SectionHeading title={heading} />
        <div className="resume-compact-row">
          <div>
            <span className="resume-file-type">PDF</span>
            <strong>{documentLabel}</strong>
          </div>
          <span>{targetRole}</span>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="View résumé"
            className="resume-inline-action"
          />
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className="p-section resume-section resume-v-split">
        <SectionHeading title={heading} />
        <div className="resume-split-panel">
          <div className="resume-split-copy">
            <p className="eyebrow">Experience / skills / impact</p>
            <h3>The detailed version of {profileName}&apos;s work.</h3>
            <p>
              Open the full résumé for the complete professional timeline,
              responsibilities, and technical background.
            </p>
          </div>
          <div className="resume-document-card">
            <span className="resume-document-icon" aria-hidden="true">
              PDF
            </span>
            <div>
              <strong>{documentLabel}</strong>
              <small>{targetRole}</small>
            </div>
            <ResumeModalLauncher
              url={url}
              fileName={fileName}
              label="View document ↗"
              className="resume-document-action"
            />
          </div>
        </div>
      </section>
    );
  }

  if (variant === "spotlight") {
    return (
      <section className="p-section resume-section resume-v-spotlight">
        <div className="resume-spotlight-panel">
          <span className="resume-spotlight-index">05 / Résumé</span>
          <h2>{heading}</h2>
          <p>{targetRole}</p>
          <strong>{documentLabel}</strong>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="Read the full résumé"
            className="resume-spotlight-action"
          />
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section className="p-section resume-section resume-v-minimal">
        <div className="resume-minimal-row">
          <div>
            <span>05</span>
            <h2>{heading}</h2>
          </div>
          <p>{documentLabel}</p>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="View PDF ↗"
            className="resume-minimal-action"
          />
        </div>
      </section>
    );
  }

  if (variant === "terminal") {
    return (
      <section className="p-section resume-section resume-v-terminal">
        <SectionHeading title={heading} />
        <div className="terminal-window resume-terminal-window">
          <p>
            <span className="terminal-prompt">$</span> open resume.pdf
          </p>
          <p className="resume-terminal-file">{documentLabel}</p>
          <p>
            <span className="terminal-prompt">role:</span> {targetRole}
          </p>
          <ResumeModalLauncher
            url={url}
            fileName={fileName}
            label="view --resume ↗"
            className="resume-terminal-action"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="p-section resume-section resume-v-embed">
      <div className="resume-section-head">
        <SectionHeading title={heading} />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          data-analytics-event="resume_opened"
          data-analytics-target="resume"
        >
          Open PDF ↗
        </a>
      </div>
      <div className="resume-frame">
        <iframe
          src={url}
          title={`${snapshot.data.profile.name || "Portfolio"} resume`}
          loading="lazy"
        />
      </div>
    </section>
  );
}
