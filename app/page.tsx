import Link from "next/link";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { sampleSnapshot } from "@/lib/portfolio";
import { siteOrigin } from "@/lib/site-url";
import { AccountCta } from "@/components/AccountCta";

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

export default function Home() {
  const host = siteOrigin().replace(/^https?:\/\//, "");
  const samplePath = "mayachen/backend";
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
              <span className="lp-live-pill">Live</span>
            </div>
            <div className="lp-browser-body">
              <PortfolioRenderer snapshot={sampleSnapshot} compact />
            </div>
          </div>

          <div className="lp-stat-card">
            <p className="lp-stat-label">Last 14 days</p>
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
            <h3>Fill in your details</h3>
            <p>
              Type them in, or import your résumé and GitHub repos to prefill experience,
              projects, and skills. Pick section layouts and a theme. Nothing to code.
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
              Paste it wherever recruiters will see it. Make separate versions for
              different roles, each with its own link.
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
        <h2>What you get without writing code</h2>
        <dl>
          <div><dt>75 section layouts</dt><dd>Ten designs each for hero, about, experience, projects, skills, and contact.</dd></div>
          <div><dt>10 themes</dt><dd>Change the whole look in one click. Your content stays put.</dd></div>
          <div><dt>Versions per role</dt><dd>A frontend version and a backend version, each with its own link and stats.</dd></div>
          <div><dt>Hosting included</dt><dd>Nothing to deploy, renew, or keep running.</dd></div>
        </dl>
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
