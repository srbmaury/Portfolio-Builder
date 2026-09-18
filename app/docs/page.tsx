import type { Metadata } from "next";
import Link from "next/link";
import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Docs — FolioBlocks",
  description:
    "Public documentation for FolioBlocks features, publishing, analytics, privacy, and data controls.",
};

const featureGroups = [
  {
    title: "Build from structured content",
    items: [
      "Maintain one shared professional profile with experience, projects, skills, social links, and custom sections.",
      "Start from a true blank workspace, use the demo, or import a PDF/DOCX resume up to 5 MB.",
      "Resume import is parsed in memory, is not stored, and lets you review/edit profile, experience, projects, and skills before applying.",
      "Use the advanced JSON editor to edit the complete workspace: shared content, variants, targeting, design, branding, resume data, and custom sections.",
    ],
  },
  {
    title: "Create role-specific portfolios",
    items: [
      "Create multiple named portfolio variants from the same shared profile.",
      "Set a target role per variant and independently choose/reorder experience, projects, and skills.",
      "Duplicate, rename, publish, unpublish, and manage each portfolio without unexpectedly changing an existing public URL.",
      "Empty sections are automatically suppressed on the rendered portfolio.",
    ],
  },
  {
    title: "Design without coding",
    items: [
      "Choose from 10 themes: Ink, Sand, Moss, Aurora, Cobalt, Rose, Mono, Sunset, Ice, and Noir.",
      "Use 60 layouts across Hero, About, Experience, Projects, Skills, and Contact, plus 7 Resume layouts and 8 Custom Section layouts.",
      "Rename sections, show/hide them, reorder them, and shuffle designs.",
      "Preview desktop, tablet, and mobile layouts while editing, with an adjustable editor/preview split on desktop.",
    ],
  },
  {
    title: "Images, branding, and sharing",
    items: [
      "Upload hero and project images through signed Cloudinary uploads; Cloudinary secrets stay server-side.",
      "Add separate GitHub and Live Demo links to projects and skill-logo layouts with text fallbacks.",
      "Set per-portfolio favicon, social share title, share description, and share image.",
      "Publish to clean public URLs in the form /<username>/<portfolio> using immutable published snapshots.",
      "Published pages include canonical and social metadata, JSON-LD profile data, robots/sitemap discovery, skip navigation, and reduced-motion support.",
    ],
  },
  {
    title: "Resume and custom sections",
    items: [
      "Attach a public resume to an individual portfolio without forcing the same resume onto every variant.",
      "Choose from seven résumé treatments, including embedded, card, compact, split, spotlight, minimal, and terminal layouts.",
      "Create flexible custom sections for certifications, awards, education, writing, speaking, open source, or anything else.",
      "Custom sections support eight layouts, including list, cards, timeline, grid, compact, split, spotlight, and badges.",
    ],
  },
  {
    title: "First-party analytics",
    items: [
      "See views, unique visitors, engaged visitors, engagement rate, resume opens, contact clicks, project clicks, social clicks, and custom-link clicks.",
      "Inspect 7, 30, or 90 day windows, daily traffic, referrer-host breakdowns, device breakdowns, action breakdowns, and per-portfolio comparisons.",
      "Admins can access aggregate product analytics including creator activation, active/returning creators, publish rate, variants per account, time-to-first-publish, resume-import success, traffic, signups, top actions, devices, referrers, and portfolios.",
      "Analytics failures never block the public portfolio experience.",
    ],
  },
];

export default function DocsPage() {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          folio<span>blocks</span>
        </Link>
        <nav className={styles.nav} aria-label="Docs navigation">
          <Link href="/">Home</Link>
          <Link href="/builder?fresh=1">Start fresh</Link>
          <Link className={styles.primaryLink} href="/builder">
            Open builder
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>Public documentation</p>
        <h1>Everything FolioBlocks can do.</h1>
        <p className={styles.lead}>
          FolioBlocks separates your professional content from its presentation, so one
          profile can power multiple role-specific portfolios without rebuilding the
          same information again and again.
        </p>
        <div className={styles.quickFacts}>
          <span>75 section layouts</span>
          <span>10 themes</span>
          <span>Role-specific variants</span>
          <span>First-party analytics</span>
        </div>
      </section>

      <section className={styles.section} id="workflow">
        <div className={styles.sectionHeading}>
          <p>Core workflow</p>
          <h2>One profile → many focused portfolios.</h2>
        </div>
        <div className={styles.steps}>
          <article>
            <span>01</span>
            <h3>Add your content</h3>
            <p>Enter it manually, import a resume, or edit the workspace as JSON.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Target the role</h3>
            <p>Choose exactly which evidence appears in each portfolio and in what order.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Choose the presentation</h3>
            <p>Pick a theme and a layout independently for every section.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Publish and measure</h3>
            <p>Share a stable public URL and review first-party engagement analytics.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="features">
        <div className={styles.sectionHeading}>
          <p>Feature reference</p>
          <h2>What is available today.</h2>
        </div>
        <div className={styles.featureGrid}>
          {featureGroups.map((group) => (
            <article className={styles.featureCard} key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="privacy">
        <div className={styles.sectionHeading}>
          <p>Analytics privacy</p>
          <h2>Useful metrics without collecting portfolio content.</h2>
        </div>
        <div className={styles.split}>
          <article className={styles.callout}>
            <h3>What analytics stores</h3>
            <p>
              FolioBlocks uses opaque anonymous visitor/session UUIDs, event type,
              fixed content-free action targets, referrer host, device type, portfolio
              ID, and event time. Portfolio views are de-duplicated once per
              portfolio/session.
            </p>
          </article>
          <article className={styles.callout}>
            <h3>What analytics does not store</h3>
            <p>
              Public visitor analytics do not record IP addresses, names, email addresses,
              resume text, profile text, project descriptions, custom-section names,
              or full referrer URLs. Browser Do Not Track is honored. Authenticated
              creator-product events contain only user ID, event type, optional
              portfolio variant key, and timestamp.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="data">
        <div className={styles.sectionHeading}>
          <p>Storage and deletion</p>
          <h2>Your saved data has explicit lifecycle controls.</h2>
        </div>
        <div className={styles.split}>
          <article className={styles.callout}>
            <h3>Portfolio deletion</h3>
            <p>
              Deleting a portfolio removes its saved/published data, target-only
              content, attached resume, analytics events, and uploaded assets that are
              no longer referenced by another portfolio. Deleting the final portfolio
              also removes the shared workspace data.
            </p>
          </article>
          <article className={styles.callout}>
            <h3>Account deletion</h3>
            <p>
              The account danger zone permanently removes every portfolio, shared
              workspace data, published pages, uploaded Cloudinary assets, analytics
              admin membership, and the sign-in account.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="architecture">
        <div className={styles.sectionHeading}>
          <p>Implementation notes</p>
          <h2>How publishing is separated from editing.</h2>
        </div>
        <div className={styles.architecture}>
          <div>
            <strong>Editor state</strong>
            <span>Local draft + authenticated Supabase workspace</span>
          </div>
          <b>→</b>
          <div>
            <strong>Publish</strong>
            <span>Create an immutable public snapshot</span>
          </div>
          <b>→</b>
          <div>
            <strong>Public route</strong>
            <span>/&lt;username&gt;/&lt;portfolio&gt;</span>
          </div>
        </div>
        <p className={styles.note}>
          Raw draft profile, experience, project, and skill rows remain owner-only
          under Supabase Row Level Security. Workspace saves run inside one
          security-invoker Postgres transaction, while public pages read the
          published snapshot.
        </p>
      </section>

      <section className={styles.cta}>
        <p className={styles.kicker}>Build a version for the role you want</p>
        <h2>Start blank, import your resume, or explore the demo.</h2>
        <div>
          <Link className={styles.primaryButton} href="/builder?fresh=1">
            Start fresh →
          </Link>
          <Link className={styles.secondaryButton} href="/builder">
            Explore demo
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/">
          folio<span>blocks</span>
        </Link>
        <p>Public product documentation for the current FolioBlocks feature set.</p>
      </footer>
    </main>
  );
}
