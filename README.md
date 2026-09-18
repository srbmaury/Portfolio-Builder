# FolioBlocks — Modular Portfolio Builder

FolioBlocks stores professional content once and lets users create focused portfolio variants for different roles.

## Product model

- One shared professional profile
- Multiple named portfolio variants
- Per-variant target role
- Per-variant experience, project, and skill selection
- Independent ordering for targeted evidence
- Independent theme, section visibility, section order, and layout variants
- Desktop, tablet, and mobile previews
- Resizable desktop editor/preview split
- Independent editor and preview scrolling
- Local draft autosave
- Supabase authentication and cloud persistence
- Clean public portfolio URLs
- Snapshot-based public publishing with raw profile data kept private

## Run locally

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase project values, then run:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/builder`
- `http://localhost:3000/login`

## Publishing

Publishing requires an authenticated account and persists the current portfolio variant to Supabase.

Public URLs use:

```text
/u/<username>/<portfolio>
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

## Architecture

```text
Supabase Auth
     ↓
Shared Profile
├── Experience
├── Projects
├── Skills
└── Links
     ↓
Portfolio Variants
├── Target role
├── Selected evidence
├── Ordering
├── Theme
└── Section layouts
     ↓
Published snapshot
     ↓
/u/<username>/<portfolio>
```
