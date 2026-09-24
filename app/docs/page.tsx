import type { Metadata } from "next";
import Link from "next/link";
import styles from "./docs.module.css";
import { DocsToc } from "./DocsToc";
import { AccountCta } from "@/components/AccountCta";

export const metadata: Metadata = {
  title: "Docs — DevFolioX",
  description:
    "How to fill in, publish, and share a DevFolioX portfolio, and how its first-party analytics, privacy, and data controls work.",
};

const contents = [
  { id: "start", label: "Get started" },
  { id: "details", label: "Fill in your details" },
  { id: "publish", label: "Publish and share" },
  { id: "design", label: "Design" },
  { id: "versions", label: "Versions per role" },
  { id: "analytics", label: "Analytics" },
  { id: "tracked-links", label: "Tracked links" },
  { id: "privacy", label: "Analytics privacy" },
  { id: "data", label: "Your data" },
  { id: "architecture", label: "How publishing works" },
];

export default function DocsPage() {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          DevFolio<span>X</span>
        </Link>
        <nav className={styles.nav} aria-label="Docs navigation">
          <Link className={styles.navSecondary} href="/">Home</Link>
          <AccountCta
            className={styles.primaryLink}
            signedOutHref="/builder?fresh=1"
            signedOutLabel="Build my portfolio"
          />
        </nav>
      </header>

      <div className={styles.layout}>
        <DocsToc items={contents} />

        <article className={styles.article}>
          <header className={styles.intro}>
            <h1>DevFolioX docs</h1>
            <p className={styles.lead}>
              DevFolioX gives you a live portfolio link without writing code, and shows
              you every open and where it came from. This page covers everything
              it can do today.
            </p>
          </header>

          <section id="start" className={styles.section}>
            <h2>Get started</h2>
            <p>The whole flow is four steps, and only the first one takes real time.</p>
            <ol className={styles.steps}>
              <li>
                <strong>Fill in your details.</strong> Type them in, import a résumé,
                or pull projects from GitHub.
              </li>
              <li>
                <strong>Publish.</strong> Sign in and press Publish. Your portfolio goes
                live at <code>/&lt;username&gt;/&lt;portfolio&gt;</code>.
              </li>
              <li>
                <strong>Share the URL.</strong> Put it on LinkedIn, your résumé, or in
                job applications.
              </li>
              <li>
                <strong>Watch the numbers.</strong> The analytics page shows views,
                visitors, sources, and clicks for every published portfolio.
              </li>
            </ol>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href="/builder?fresh=1">
                Start from a blank portfolio
              </Link>
              <Link className={styles.textLink} href="/builder?demo=1">
                Open the demo →
              </Link>
            </div>
          </section>

          <section id="details" className={styles.section}>
            <h2>Fill in your details</h2>
            <p>
              Your profile holds your experience, projects, skills, social links, and
              custom sections. Start from a truly blank workspace, load the demo, or use
              one of the importers below.
            </p>

            <h3>Resume import</h3>
            <p>
              Upload a PDF or DOCX résumé up to 5 MB. It is parsed in memory and never
              stored. You review and edit the extracted profile, experience, projects,
              and skills before anything is applied.
            </p>

            <h3>GitHub import</h3>
            <p>
              Enter a public GitHub profile and choose repositories. Descriptions,
              languages and topics, repository links, and homepage links become
              editable projects.
            </p>

            <h3>Health check</h3>
            <p>
              Before publishing, run the health check. It flags missing identity or
              contact details, weak targeting, incomplete projects, link issues,
              résumé readiness, and layouts that need an image you have not added.
            </p>

            <h3>Custom sections</h3>
            <p>
              Add custom sections for certifications, awards, education, writing,
              speaking, open source, or anything else. They support eight layouts:
              list, cards, timeline, grid, compact, split, spotlight, and badges.
            </p>

            <h3>JSON editor</h3>
            <p>
              For bulk edits, the advanced JSON editor exposes the complete workspace:
              content, portfolio versions, targeting, design, branding, résumé data,
              and custom sections.
            </p>
          </section>

          <section id="publish" className={styles.section}>
            <h2>Publish and share</h2>
            <p>
              Publishing creates an immutable snapshot of your portfolio at a clean URL
              in the form <code>/&lt;username&gt;/&lt;portfolio&gt;</code>. Keep editing
              afterwards; visitors see the published version until you publish again,
              and the URL does not change.
            </p>
            <ul>
              <li>Publish, unpublish, duplicate, and delete each portfolio from the portfolio manager; rename it in the builder.</li>
              <li>Set a per-portfolio favicon, share title, share description, and share image for link previews.</li>
              <li>Attach a public résumé to an individual portfolio, shown in one of seven treatments: embedded, card, compact, split, spotlight, minimal, or terminal.</li>
              <li>Published pages include canonical and social metadata, JSON-LD profile data, sitemap discovery, skip navigation, and reduced-motion support.</li>
            </ul>
          </section>

          <section id="design" className={styles.section}>
            <h2>Design</h2>
            <p>
              Every section has its own layout, chosen independently of the theme. None
              of it requires code.
            </p>
            <table className={styles.table}>
              <tbody>
                <tr><th scope="row">Themes</th><td>10: Ink, Sand, Moss, Aurora, Cobalt, Rose, Mono, Sunset, Ice, and Noir</td></tr>
                <tr><th scope="row">Core sections</th><td>60 layouts across Hero, About, Experience, Projects, Skills, and Contact</td></tr>
                <tr><th scope="row">Résumé</th><td>7 layouts</td></tr>
                <tr><th scope="row">Custom sections</th><td>8 layouts</td></tr>
              </tbody>
            </table>
            <ul>
              <li>Rename, show or hide, reorder, and shuffle sections. Empty sections are hidden automatically.</li>
              <li>Preview desktop, tablet, and mobile while editing, with an adjustable editor and preview split.</li>
              <li>Upload hero and project images through signed Cloudinary uploads. Secrets stay on the server.</li>
              <li>Projects can have separate GitHub and live demo links. Skill-logo layouts fall back to text.</li>
            </ul>
          </section>

          <section id="versions" className={styles.section}>
            <h2>Versions per role</h2>
            <p>
              Create several named portfolios, for example one for backend roles and one
              for product engineering. Each has its own target role, its own content,
              its own choice and order of experience, projects, and skills, and its own
              URL and analytics. Editing one leaves the others untouched.
            </p>
          </section>

          <section id="analytics" className={styles.section}>
            <h2>First-party analytics</h2>
            <p>
              Every published portfolio is counted automatically. There is nothing to
              install or connect.
            </p>
            <table className={styles.table}>
              <tbody>
                <tr><th scope="row">Reach</th><td>Views, unique visitors, engaged visitors, engagement rate</td></tr>
                <tr><th scope="row">Actions</th><td>Résumé opens and clicks on contact, project, social, and custom links</td></tr>
                <tr><th scope="row">Sources</th><td>Your tracked link’s name, or the referring site’s hostname such as github.com, plus device type</td></tr>
                <tr><th scope="row">Time</th><td>Daily traffic over 7, 30, or 90 days</td></tr>
                <tr><th scope="row">Comparison</th><td>All portfolios side by side</td></tr>
              </tbody>
            </table>
            <p>
              Analytics never block the public page: if recording fails, the portfolio
              still loads normally. Site administrators also see aggregate product
              metrics such as sign-ups, publish rate, and time to first publish.
            </p>
          </section>

          <section id="tracked-links" className={styles.section}>
            <h2>Tracked links</h2>
            <p>
              Browsers usually hide where a visit came from when the link is opened
              from an email app, a PDF résumé, or a chat app, so those visits would
              otherwise count as Direct. Tracked links fix that: each one adds{" "}
              <code>?via=&lt;name&gt;</code> to your URL, and visits through it are
              labelled with that name in analytics.
            </p>
            <ul>
              <li>Copy them from the portfolio manager or right after you publish: LinkedIn, Résumé, Email, GitHub, X, or any name you type, such as a company you are applying to.</li>
              <li>The tag is removed from the address bar once the page loads, so a visitor who re-shares the page does not pass your tag along.</li>
              <li>A tag is only the name you chose. It says nothing about the visitor.</li>
            </ul>
          </section>

          <section id="privacy" className={styles.section}>
            <h2>Analytics privacy</h2>
            <p>
              Analytics count visits. They are not built to identify the people behind them.
            </p>
            <div className={styles.split}>
              <div>
                <h3>What is stored</h3>
                <p>
                  Random visitor and session IDs, the event type, a fixed action target,
                  referrer host, device type, portfolio ID, and time. A view is counted
                  once per portfolio per session.
                </p>
              </div>
              <div>
                <h3>What is not stored</h3>
                <p>
                  IP addresses, names, email addresses, résumé or profile text, project
                  descriptions, custom-section names, or full referrer URLs. Browser Do
                  Not Track is honoured. Signed-in creator events contain only a user
                  ID, event type, optional portfolio key, and time.
                </p>
              </div>
            </div>
          </section>

          <section id="data" className={styles.section}>
            <h2>Your data</h2>
            <h3>Portfolio deletion</h3>
            <p>
              Deleting a portfolio removes its saved and published data, its own
              content, attached résumé, analytics events, and any uploaded images no
              other portfolio uses. Deleting your last portfolio also removes the
              shared workspace data.
            </p>
            <h3>Account deletion</h3>
            <p>
              The danger zone in your account permanently removes every portfolio,
              workspace data, published pages, uploaded Cloudinary images, analytics
              admin membership, and the sign-in account itself.
            </p>
          </section>

          <section id="architecture" className={styles.section}>
            <h2>How publishing works</h2>
            <p>
              Editing and publishing are separate. Drafts live in your browser and your
              signed-in workspace; publishing copies a snapshot to the public route.
            </p>
            <ol className={styles.flow}>
              <li><strong>Draft</strong><span>Local draft and signed-in Supabase workspace</span></li>
              <li><strong>Publish</strong><span>Creates an immutable public snapshot</span></li>
              <li><strong>Public URL</strong><span><code>/&lt;username&gt;/&lt;portfolio&gt;</code></span></li>
            </ol>
            <p>
              Draft profile, experience, project, and skill rows are readable only by
              their owner under Supabase Row Level Security. Workspace saves run in a
              single Postgres transaction, and public pages read only the published
              snapshot.
            </p>
          </section>

          <footer className={styles.footer}>
            <p>Ready? The first step takes a few minutes.</p>
            <Link className={styles.primaryButton} href="/builder?fresh=1">
              Build my portfolio
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
