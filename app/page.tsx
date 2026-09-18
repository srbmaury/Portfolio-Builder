import Link from "next/link";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { sampleSnapshot } from "@/lib/portfolio";

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="brand brand-light" href="/">folio<span>blocks</span></a>
        <div className="landing-nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why it is different</a>
          <Link className="nav-cta" href="/builder">Start building</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-glow" />
        <p className="landing-kicker">Portfolio building, without the blank canvas</p>
        <h1>Your story. <em>Your sections.</em> Your site.</h1>
        <p className="landing-subtitle">
          Keep your professional story structured, mix and match pre-built sections,
          and publish a polished portfolio in minutes.
        </p>
        <div className="landing-actions">
          <Link className="landing-primary" href="/builder">Build my portfolio →</Link>
          <a className="landing-secondary" href="#how">See how it works</a>
        </div>

        <div className="landing-proof">
          <span>No code</span><span>Live preview</span><span>Swap sections anytime</span><span>Share instantly</span>
        </div>

        <div className="landing-product-shot">
          <div className="product-shot-bar">
            <div><span /><span /><span /></div>
            <p>Live portfolio preview</p>
            <strong>Published</strong>
          </div>
          <div className="product-shot-body">
            <PortfolioRenderer snapshot={sampleSnapshot} compact />
          </div>
        </div>
      </section>

      <section id="how" className="landing-section">
        <div className="landing-section-heading">
          <p>How it works</p>
          <h2>Build like Lego, not like a web designer.</h2>
        </div>
        <div className="steps-grid">
          <article><span>01</span><h3>Add your story</h3><p>Enter your experience, projects, skills, links, and the kind of work you want.</p></article>
          <article><span>02</span><h3>Pick each section</h3><p>Choose a hero, experience layout, projects grid, skills view, and contact block independently.</p></article>
          <article><span>03</span><h3>Change your mind</h3><p>Swap any section later without re-entering content or rebuilding the rest of the site.</p></article>
          <article><span>04</span><h3>Publish</h3><p>Generate a shareable portfolio URL and send it directly to recruiters, clients, or collaborators.</p></article>
        </div>
      </section>

      <section id="why" className="landing-section difference-section">
        <div className="difference-copy">
          <p className="landing-kicker">The core idea</p>
          <h2>Your content is not your template.</h2>
          <p>
            Traditional builders lock your information into a page. FolioBlocks stores your professional profile separately,
            then lets any compatible section render it. One profile can power many portfolio styles.
          </p>
          <Link className="landing-primary" href="/builder">Try the builder →</Link>
        </div>
        <div className="architecture-card">
          <div className="arch-node arch-data"><strong>Your profile</strong><span>Experience · Projects · Skills</span></div>
          <div className="arch-arrow">↓</div>
          <div className="arch-row">
            <div className="arch-node"><strong>Hero #3</strong><span>Terminal</span></div>
            <div className="arch-node"><strong>Projects #1</strong><span>Bento</span></div>
            <div className="arch-node"><strong>Skills #2</strong><span>Columns</span></div>
          </div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node arch-live"><strong>Your live portfolio</strong><span>Change any piece, anytime</span></div>
        </div>
      </section>

      <footer className="landing-footer">
        <a className="brand brand-light" href="/">folio<span>blocks</span></a>
        <p>An MVP for modular professional portfolios.</p>
        <Link href="/builder">Open builder →</Link>
      </footer>
    </main>
  );
}
