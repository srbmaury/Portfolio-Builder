import Link from "next/link";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { sampleSnapshot } from "@/lib/portfolio";
import { loadPublishedSnapshot } from "@/lib/supabase/public-portfolio";
import { siteOrigin } from "@/lib/site-url";
import { AccountCta } from "@/components/AccountCta";
import { ScaledPreview } from "@/components/ScaledPreview";

// A real published portfolio shown in the hero. It is rendered from its
// published snapshot rather than embedded, so home-page visits are not counted
// as views of that portfolio. If it is ever unpublished the bundled demo is
// shown instead.
const LIVE_EXAMPLE_PATH = "saurabh-maurya-aaa5bf/backend-platform";

// Static page, refreshed from the database at most every 10 minutes.
export const revalidate = 600;

async function loadLiveExample() {
  try {
    const [username, portfolio] = LIVE_EXAMPLE_PATH.split("/");
    return await loadPublishedSnapshot(username, portfolio);
  } catch {
    return null;
  }
}

// Illustrative numbers for the analytics mock-ups. They are labelled as
// sample data on the page so nobody mistakes them for real traffic.
const SAMPLE_DAILY_VIEWS = [4, 7, 5, 12, 9, 18, 14, 22, 16, 27, 21, 31, 24, 29];
const SAMPLE_REFERRERS = [
  { label: "linkedin.com", count: 64 },
  { label: "Résumé (your link)", count: 41 },
  { label: "google.com", count: 18 },
  { label: "github.com", count: 9 },
];
const SAMPLE_ACTIONS = [
  { label: "Opened résumé", count: 37 },
  { label: "Clicked a project", count: 29 },
  { label: "Clicked contact", count: 11 },
];

export default async function Home() {
  const origin = siteOrigin();
  const host = origin.replace(/^https?:\/\//, "");
  const liveExample = await loadLiveExample();
  const heroSnapshot = liveExample ?? sampleSnapshot;
  const samplePath = liveExample ? LIVE_EXAMPLE_PATH : "mayachen/backend";
  const liveUrl = liveExample ? `${origin}/${LIVE_EXAMPLE_PATH}` : null;
  const maxViews = Math.max(...SAMPLE_DAILY_VIEWS);
  const maxReferrer = SAMPLE_REFERRERS[0].count;

  return (
    <main className="lp">
      <nav className="lp-nav">
        <a className="brand" href="/">DevFolio<span>X</span></a>
        <div className="lp-nav-links">
          <a className="lp-nav-secondary" href="#how">How it works</a>
          <a className="lp-nav-secondary" href="#analytics">Analytics</a>
          <Link className="lp-nav-docs" href="/docs">Docs</Link>
          <AccountCta
            className="lp-button lp-button-small"
            signedOutHref="/builder?fresh=1"
            signedOutLabel="Get your link"
          />
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <p className="lp-live-tag"><i aria-hidden="true" /> Live in minutes, not weekends</p>
          <h1>
            A live portfolio link.
            <span> No code. </span>
            <span>See how many opened it.</span>
          </h1>
          <p className="lp-lede">
            Fill in your details, press publish, and share one URL with recruiters.
            DevFolioX hosts it for you and counts every visit: how many people viewed it,
            which sites sent them, and how many opened your résumé.
          </p>
          <div className="lp-actions">
            <Link className="lp-button" href="/builder?fresh=1">Build my portfolio</Link>
            <Link className="lp-link" href="/builder?demo=1">See a finished example →</Link>
          </div>
          <ul className="lp-promises">
            <li>No hosting or deploys</li>
            <li>Import from your résumé or GitHub</li>
            <li>Analytics included</li>
          </ul>
        </div>

        <div className="lp-hero-visual" aria-label="A published portfolio with its analytics">
          <div className="lp-browser">
            <div className="lp-browser-bar">
              <span className="lp-url"><i aria-hidden="true" />{host}/<b>{samplePath}</b></span>
              {liveUrl ? (
                <a className="lp-live-pill" href={liveUrl} target="_blank" rel="noreferrer">
                  Live · Open ↗
                </a>
              ) : (
                <span className="lp-live-pill">Live</span>
              )}
            </div>
            <div className="lp-browser-body">
              <ScaledPreview className="lp-browser-scaled">
                <PortfolioRenderer snapshot={heroSnapshot} />
              </ScaledPreview>
              {liveUrl ? (
                // A sibling overlay, not a wrapper: the portfolio has its own
                // links and anchors cannot be nested.
                <a
                  className="lp-browser-link"
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open this live portfolio in a new tab"
                />
              ) : null}
            </div>
          </div>

          <div className="lp-stat-card">
            <p className="lp-stat-label">Example · last 14 days</p>
            <div className="lp-stat-row">
              <div><strong>238</strong><span>views</span></div>
              <div><strong>37</strong><span>résumé opens</span></div>
            </div>
            <div className="lp-spark" aria-hidden="true">
              {SAMPLE_DAILY_VIEWS.map((value, index) => (
                <i key={index} style={{ height: `${(value / maxViews) * 100}%` }} />
              ))}
            </div>
            <p className="lp-stat-foot">Top source: linkedin.com</p>
          </div>
        </div>
      </section>

      <section id="how" className="lp-section">
        <header className="lp-section-head">
          <h2>Three steps. The last one is sending a link.</h2>
          <p>There is no step where you pick a host, set up a domain, or run a deploy.</p>
        </header>

        <ol className="lp-steps">
          <li>
            <div className="lp-step-visual lp-form" aria-hidden="true">
              <label>Name<span>Maya Chen</span></label>
              <label>Role<span>Backend engineer</span></label>
              <div className="lp-form-import">Import from résumé (PDF, DOCX) or GitHub</div>
            </div>
            <h3>Start with what you already have</h3>
            <p>
              Upload your résumé to prefill the portfolio, import GitHub projects if you
              want them, then review the live preview before publishing.
            </p>
          </li>
          <li>
            <div className="lp-step-visual lp-publish" aria-hidden="true">
              <span className="lp-publish-button">Publish</span>
              <span className="lp-publish-status"><i />Live at /{samplePath}</span>
            </div>
            <h3>Publish</h3>
            <p>
              One click puts it online. Edit later and publish again; the link stays the same.
            </p>
          </li>
          <li>
            <div className="lp-step-visual lp-share" aria-hidden="true">
              <span className="lp-share-url">{host}/{samplePath}</span>
              <span className="lp-share-copy">Copy link</span>
              <span className="lp-share-where">LinkedIn · résumé · cold email · job applications</span>
            </div>
            <h3>Share the URL</h3>
            <p>
              Paste it wherever recruiters will see it. Use an optional tracked link when
              you want to know whether a visit came from LinkedIn, your résumé, or a specific application.
            </p>
          </li>
        </ol>
      </section>

      <section id="analytics" className="lp-section lp-analytics">
        <div className="lp-analytics-copy">
          <h2>Then see what happened to the link.</h2>
          <p>
            Most portfolio builders stop at publishing. DevFolioX keeps counting:
            how many people viewed each portfolio, which sites sent them, what devices
            they used, and which links got clicked.
          </p>
          <ul className="lp-checks">
            <li>Views, unique visitors, and engaged visitors</li>
            <li>Where visits came from, including tracked links for LinkedIn, your résumé, or a specific application</li>
            <li>Résumé opens and clicks on projects, contact, and social links</li>
            <li>Compare versions side by side over 7, 30, or 90 days</li>
          </ul>
          <p className="lp-fineprint">
            Analytics are built in and first-party. No third-party trackers, and visitor
            IP addresses are never stored.
          </p>
        </div>

        <figure className="lp-dash">
          <div className="lp-dash-head">
            <strong>Backend &amp; Platform</strong>
            <span>30 days</span>
          </div>
          <div className="lp-dash-metrics">
            <div><span>Views</span><strong>412</strong></div>
            <div><span>Unique visitors</span><strong>268</strong></div>
            <div><span>Résumé opens</span><strong>37</strong></div>
          </div>
          <div className="lp-dash-cols">
            <div>
              <p>Where visitors came from</p>
              {SAMPLE_REFERRERS.map((item) => (
                <div className="lp-bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <b>{item.count}</b>
                  <i style={{ width: `${(item.count / maxReferrer) * 100}%` }} />
                </div>
              ))}
            </div>
            <div>
              <p>What they did</p>
              {SAMPLE_ACTIONS.map((item) => (
                <div className="lp-action-row" key={item.label}>
                  <span>{item.label}</span>
                  <b>{item.count}</b>
                </div>
              ))}
            </div>
          </div>
          <figcaption>Sample data</figcaption>
        </figure>
      </section>

      <section className="lp-section lp-nocode">
        <h2>From résumé to a portfolio you can measure.</h2>
        <dl>
          <div><dt>Import your résumé</dt><dd>Prefill your profile, experience, projects, and skills instead of rebuilding them from scratch.</dd></div>
          <div><dt>Publish instantly</dt><dd>No hosting setup, deploy pipeline, DNS work, or maintenance before you can share the link.</dd></div>
          <div><dt>Track engagement</dt><dd>See visits, résumé opens, project clicks, contact clicks, and which sources drive them.</dd></div>
          <div><dt>Share anywhere</dt><dd>Use the normal URL or create an optional tracked link for LinkedIn, your résumé, email, or an application.</dd></div>
        </dl>
        <p className="lp-feature-note">10 themes · 75 section layouts · responsive previews included when you want to customize the design.</p>
      </section>

      <section className="lp-cta">
        <h2>Your portfolio link could be live before your coffee cools.</h2>
        <Link className="lp-button" href="/builder?fresh=1">Build my portfolio</Link>
      </section>

      <footer className="lp-footer">
        <a className="brand" href="/">DevFolio<span>X</span></a>
        <p>Instant live portfolios, no code, with analytics.</p>
        <div className="lp-footer-links">
          <Link href="/docs">Docs</Link>
          <Link href="/builder">Open builder</Link>
        </div>
      </footer>
    </main>
  );
}
