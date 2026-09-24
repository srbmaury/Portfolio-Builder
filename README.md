# DevFolioX — Instant live portfolios, no code, with analytics

DevFolioX gets you a live portfolio URL without writing code: fill in your details, publish, and share the link. Every published portfolio comes with built-in first-party analytics, so you can see how many people viewed it, which sites sent them, and how many opened your résumé.

**One shared profile → multiple role-specific portfolios.** Content is stored separately from presentation, so the same experience, projects, skills, links, and custom content can be reused across variants while each portfolio keeps its own targeting, section order, layouts, theme, branding, resume, and public URL.

## Demo

- **Live app:** [devfoliox.srbmaury.com](https://devfoliox.srbmaury.com)
- **Video walkthrough:** [Watch the short demo on X](https://x.com/SrbMaury/status/2101552716082495656)

> GitHub README files do not run X's embed script, so the original video is provided as a direct link.

## What is included

### Content and authoring

- Shared professional profile with experience, projects, skills, social links, and custom sections.
- True blank **Start fresh** mode plus a demo workspace.
- **Resume import** from PDF or DOCX (maximum 5 MB). Import parsing happens in memory and the uploaded import file is not stored.
- **GitHub project import** from any public GitHub profile. Select repositories and import descriptions, primary language/topics, repository links, and homepage/live links while skipping projects already imported.
- **Portfolio health check** for the active variant, covering missing identity/contact data, targeting gaps, project completeness, broken links, resume readiness, and image-led layout requirements. Findings jump directly to Content, Targeting, or Design and never block publishing.
- Review/edit imported profile, experience, projects, and skills before applying them.
- **Edit workspace as JSON** for the complete structured workspace. Invalid JSON is never applied.
- Local draft autosave plus authenticated Supabase cloud persistence through an atomic Postgres RPC, so a failed save cannot leave half-replaced experience/project/skill data.

### Role-specific portfolios

- Multiple named portfolio variants from one shared profile.
- Per-variant target role.
- Per-variant selection and ordering of experience, projects, and skills.
- Per-variant section titles, visibility, ordering, layouts, theme, branding, and resume.
- Duplicate, rename, publish, unpublish, open, copy-link, analytics, and delete controls.
- Automatic suppression of empty sections.

### Design system

DevFolioX currently provides **75 section layouts**:

- Hero: 10
- About: 10
- Experience: 10
- Projects: 10
- Skills: 10
- Resume: 7
- Contact: 10
- Custom sections: 8

It also includes:

- 10 portfolio themes.
- Desktop, tablet, and mobile previews.
- Resizable desktop editor/preview split with independent scrolling.
- Cloudinary-backed hero/project images.
- Separate GitHub and Live Demo links for each project.
- Skill-logo layouts powered by Simple Icons with text fallbacks.
- Design shuffle for quickly exploring combinations.

### Resume and custom sections

- Per-portfolio public resume upload.
- Seven résumé presentations ranging from embedded PDF to compact, split, spotlight, minimal, and terminal treatments.
- Custom sections for content such as education, certifications, awards, writing, speaking, open source, or other structured material.
- Eight custom-section layouts with optional metadata and links.

### Branding and public sharing

- Clean public URLs:

  ```text
  /<username>/<portfolio>
  ```

- Per-portfolio favicon.
- Custom social share title and description.
- Custom social preview image with generated fallback.
- Snapshot-based publishing: public routes read an immutable published snapshot while raw draft rows stay private.
- Public portfolio SEO includes canonical/Open Graph/Twitter metadata, JSON-LD profile data, `robots.txt`, and a dynamic `sitemap.xml`.
- Generated public portfolios include skip navigation and reduced-motion support.

### First-party analytics

Creators can view first-party analytics directly inside DevFolioX:

- Views and unique visitors.
- Engaged visitors and engagement rate.
- Resume opens.
- Contact clicks.
- Project clicks.
- Social clicks.
- Custom-link clicks.
- 7 / 30 / 90 day windows.
- Daily traffic.
- Referrer-host breakdown.
- Device breakdown.
- Action breakdown.
- Per-portfolio comparisons.

Admin analytics additionally includes account counts, total/published/active portfolios, creator activation funnel, active/returning creators, publish rate, average variants per account, time-to-first-publish, resume-import success rate, traffic, signups, top referrers/devices/actions, and top portfolios.

Analytics privacy:

- Uses opaque anonymous visitor and session UUIDs.
- De-duplicates portfolio views once per portfolio/session.
- Honors browser Do Not Track.
- Does not store IP addresses, names, emails, resume text, profile text, project descriptions, custom-section names, or full referrer URLs.
- Analytics failures never break the public portfolio experience.
- Authenticated product analytics store only the creator user ID, event type, optional portfolio variant key, and timestamp; normal creators cannot read the aggregate product-events table.

## Public docs

The app includes a public feature reference at:

```text
/docs
```

It explains the builder workflow, current features, analytics/privacy behavior, publishing model, and deletion lifecycle.

## Data lifecycle

Deleting a portfolio removes its saved/published data, target-only content, attached resume, analytics events, and uploaded assets that are no longer referenced by another portfolio. All database-side deletion runs inside one RLS-aware Postgres transaction, so any database error rolls the complete delete back. Irreversible Cloudinary cleanup runs only after that transaction commits. Deleting the last portfolio also removes the shared workspace data.

The account danger zone permanently removes all portfolios, shared workspace data, published pages, uploaded Cloudinary assets, product analytics, and the sign-in account.

## Run locally

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in Supabase and Cloudinary configuration:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional, server-only; raises GitHub API limits for repository import.
GITHUB_TOKEN=
```

Then run:

```bash
npm install
npm run dev
```

Useful routes:

- `http://localhost:3000`
- `http://localhost:3000/docs`
- `http://localhost:3000/builder?fresh=1` — blank workspace
- `http://localhost:3000/builder` — demo/saved workspace
- `http://localhost:3000/login`
- `http://localhost:3000/portfolios` — authenticated portfolio manager
- `http://localhost:3000/analytics` — authenticated creator analytics
- `http://localhost:3000/admin/analytics` — allowlisted admin analytics

## Validation

```bash
npm test
npm run typecheck
npm run build

# Browser journeys (requires Playwright test package/browser)
npx playwright test
```

## Cloudinary security

Cloudinary credentials stay server-side. The browser requests short-lived signed uploads from the app and uploads directly to Cloudinary; the API secret never reaches client code. Published portfolio images are restricted to `res.cloudinary.com` URLs.

## Supabase

Region: `ap-south-1`.

Frontend code uses only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never expose a Supabase secret or service-role key to the browser.

Before production deployment, configure the production domain in Supabase Auth URL Configuration so authentication redirects are accepted. Analytics data is protected with Row Level Security, and admin analytics access is gated by the server-side `ADMIN_EMAIL` setting.
