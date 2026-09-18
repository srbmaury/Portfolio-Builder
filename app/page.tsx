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
          <Link href="/docs">Docs</Link>
          <Link className="nav-cta" href="/builder?fresh=1">Start fresh</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-glow" />
        <p className="landing-kicker">Portfolio building, without the blank canvas</p>
        <h1>Your story. <em>Your sections.</em> Your site.</h1>
        <p className="landing-subtitle">
          Start completely blank or from a demo, then mix 65 section layouts, images,
          role-targeted content, and themes into a portfolio that feels uniquely yours.
        </p>
        <div className="landing-actions">
          <Link className="landing-primary" href="/builder?fresh=1">Start fresh →</Link>
          <Link className="landing-secondary" href="/builder">Explore with demo</Link>
        </div>

        <div className="landing-proof">
          <span>65 section layouts</span><span>10 themes</span><span>Cloudinary images</span><span>Role-targeted variants</span>
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
          <article><span>02</span><h3>Pick each section</h3><p>Choose from 10 real designs for every Hero, About, Experience, Projects, Skills, and Contact section.</p></article>
          <article><span>03</span><h3>Target the role</h3><p>Choose and reorder the experience, projects, and skills that matter most for each portfolio variant.</p></article>
          <article><span>04</span><h3>Publish</h3><p>Generate a shareable portfolio URL and send it directly to recruiters, clients, or collaborators.</p></article>
        </div>
      </section>

      <section id="why" className="landing-section difference-section">
        <div className="difference-copy">
          <p className="landing-kicker">The core idea</p>
          <h2>Your content is not your template.</h2>
          <p>
            Traditional builders lock your information into a page. FolioBlocks stores your professional profile separately,
            then lets any compatible section render it. One shared profile can power several role-specific portfolios, each with its own design.
          </p>
          <Link className="landing-primary" href="/builder?fresh=1">Start from scratch →</Link>
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
          <div className="arch-node arch-live"><strong>Share the right version</strong><span>Same profile · Different presentation</span></div>
        </div>
      </section>

      <footer className="landing-footer">
        <a className="brand brand-light" href="/">folio<span>blocks</span></a>
        <p>Modular portfolios for different roles.</p>
        <Link href="/docs">Docs</Link>
        <Link href="/builder">Open builder →</Link>
      </footer>
    </main>
  );
}
