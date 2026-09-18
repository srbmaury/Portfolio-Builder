# FolioBlocks — Modular Portfolio Builder

A portfolio builder where professional content is stored separately from presentation.

Users maintain one structured profile, create multiple portfolio variants for different roles or audiences, and independently choose the hero, about, experience, project, skills, and contact layouts for each variant.

## MVP v2 included

- One shared structured professional profile
- Multiple named portfolio variants from the same profile
- Independent theme and section configuration per variant\n- Per-variant experience, project, and skill selection + ordering\n- Target role is rendered directly in the portfolio hero
- Duplicate/delete portfolio variants
- Editable profile, experience, projects, skills, and social links
- Project stack and URL editing
- Add/remove experience, projects, and links
- Live desktop, tablet, and mobile preview modes
- Three visual themes
- Swappable section variants
- Show/hide and reorder sections
- One-click design shuffle
- Local autosave with migration from the v1 builder state
- Shareable published portfolio links
- Portfolio-specific page title and description metadata
- Responsive landing, builder, and public portfolio pages

The current MVP intentionally uses URL-encoded portfolio snapshots for publishing. This keeps the full create → customize → variant → publish → share loop testable without requiring authentication or a database.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use `http://localhost:3000/builder` for the editor.

## Product architecture

```
Shared professional profile
  ├── Profile
  ├── Experience
  ├── Projects
  ├── Skills
  └── Social links
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
  Backend variant   AI variant    General variant
  ├── Theme         ├── Theme      ├── Theme
  ├── Sections      ├── Sections   ├── Sections
  └── Order         └── Order      └── Order
        │              │              │
        └──────────────┴──────────────┘
                       ▼
                PortfolioRenderer
                       ▼
             Live preview / share URL
```

## Next production milestones

1. Authentication and persistent user profiles.
2. PostgreSQL/Supabase storage for profiles and variants.
3. Stable short publishing URLs instead of encoded query strings.
4. Resume import and GitHub project import.
5. Per-variant project/experience visibility and ordering.
6. Custom domains and portfolio analytics.
7. More section packs and a template marketplace.
