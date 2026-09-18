# FolioBlocks — Modular Portfolio Builder

FolioBlocks stores professional content once and lets users create focused portfolio variants for different roles.

## Product model

- One shared professional profile
- Multiple named portfolio variants
- Per-variant target role
- Per-variant experience, project, and skill selection
- Per-variant section headings
- Automatic suppression of empty sections
- Independent ordering for targeted evidence
- Independent theme, section visibility, section order, and layout variants
- **10 designs for every section**: Hero, About, Experience, Projects, Skills, and Contact
- 10 portfolio themes
- Cloudinary-backed hero and project images
- Separate GitHub and Live Demo links for every project
- Skill-logo layouts powered by Simple Icons with text fallbacks
- Desktop, tablet, and mobile previews
- Resizable desktop editor/preview split
- Independent editor and preview scrolling
- True blank "Start fresh" mode
- Local draft autosave
- Supabase authentication and cloud persistence
- Clean public portfolio URLs
- Snapshot-based public publishing with raw profile data kept private

## Run locally

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in Supabase and Cloudinary configuration, then run:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/builder?fresh=1` for a blank workspace
- `http://localhost:3000/builder` for the demo/saved workspace
- `http://localhost:3000/login`

## Cloudinary images

Create an **unsigned upload preset** in Cloudinary and set:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Hero and project uploads are sent directly from the browser to Cloudinary. Published portfolio images are restricted to `res.cloudinary.com` URLs.

## Publishing

Publishing requires an authenticated account and persists the current portfolio variant to Supabase.

Public URLs use:

```text
/<username>/<portfolio>
```

The public endpoint reads only the immutable published snapshot. Draft profile, experience, project, and skill rows remain owner-only under RLS.

## Supabase

Region: `ap-south-1`.

Frontend code uses only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never expose a Supabase secret or service-role key to the browser.

Before production deployment, configure the production domain in Supabase Auth URL Configuration so authentication redirects are accepted.
