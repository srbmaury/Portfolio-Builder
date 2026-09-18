# FolioBlocks — Modular Portfolio Builder

A portfolio builder where the user's professional content is stored separately from its presentation.

Instead of choosing one monolithic theme, users independently select a hero, about section, experience layout, projects layout, skills section, and contact section. They can change those pieces later without re-entering content.

## MVP included

- Structured professional profile
- Live portfolio preview
- Three visual themes
- Swappable section variants
- Show/hide and reorder sections
- Editable profile and project content
- Local autosave
- Shareable published portfolio links
- Responsive landing, builder, and public portfolio pages
- GitHub Actions production-build validation

The current MVP intentionally uses URL-encoded portfolio snapshots for publishing. That means a shared portfolio works without a database or account system and makes the first product loop testable immediately.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Product architecture

```
Structured profile
  ├── Profile
  ├── Experience
  ├── Projects
  └── Skills
        +
Portfolio configuration
  ├── Theme
  ├── Section order
  ├── Visibility
  └── Variant per section
        ↓
PortfolioRenderer
        ↓
Live preview / shareable portfolio
```

## Next production milestones

1. Authentication and persistent user profiles.
2. PostgreSQL/Supabase storage for portfolio snapshots.
3. Stable short publishing URLs instead of encoded query strings.
4. Resume + GitHub import.
5. Per-role portfolio variants from one profile.
6. Custom domains and analytics.
7. More section packs and a template marketplace.
