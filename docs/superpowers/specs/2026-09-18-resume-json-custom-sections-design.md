# Resume Import, JSON Editing, and Custom Sections Design

Date: 2026-09-18

## Scope

Implement three related authoring capabilities in FolioBlocks:

1. Resume import: PDF/DOCX → structured extraction → review → merge into shared content.
2. Advanced JSON editing for the complete workspace state.
3. First-class reusable custom sections for content such as Education, Certifications, Awards, Publications, Open Source, Talks, and Testimonials.

No AI job tailoring, analytics, custom domains, or unrelated product work is included.

## Resume import

The approved flow remains unchanged:
- Content tab exposes **Import resume**.
- User uploads PDF or DOCX.
- A server route extracts plain text in memory.
- Deterministic parsing produces a partial structured draft for profile, experience, projects, skills, and links.
- User reviews/edits the extracted draft before applying it.
- Applying merges non-empty profile fields, de-duplicates experience/projects/skills/links, and automatically targets newly imported items in the active variant.
- Resume bytes are never persisted.

## JSON editing

An **Edit as JSON** advanced action opens a modal containing the complete `BuilderState`.

Controls:
- Format JSON
- Reset to current workspace
- Apply changes
- Cancel

Requirements:
- Invalid JSON never replaces current state.
- Parsed data must pass structural validation, then `normalizeBuilderState`.
- Applying JSON clears stale share-toast state but otherwise uses the normal local/cloud save and publish flows.
- JSON editing includes variants, targeting, branding, design config, and custom sections.

## Custom sections

### Content model

Custom section content is shared across portfolio variants, like the core profile content.

```ts
type CustomSectionItem = {
  id: string;
  heading: string;
  subheading: string;
  meta: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
};

type CustomSection = {
  id: string;
  title: string;
  items: CustomSectionItem[];
};
```

`PortfolioData` gains `customSections: CustomSection[]`.

### Variant config

Each custom section gets one config entry per portfolio variant so visibility, order, title override, and layout are variant-specific.

Custom config entries have:
- stable config id
- `type: "custom"`
- `customSectionId`
- `variant: "list" | "cards" | "timeline"`
- `visible`
- optional variant-specific `title`

Existing built-in section configs remain valid and normalize with inferred types.

When a new custom section is created:
- its content is added once to shared data
- active variant gets it visible at the end of its section order
- other variants get it hidden by default so it can be enabled later

Deleting a custom section removes its shared content and all matching variant config entries.

### Rendering

The public renderer looks up custom content by `customSectionId` and renders only if it contains at least one non-empty item.

Generic layouts:
- **List**: dense rows
- **Cards**: responsive cards
- **Timeline**: period/meta-forward vertical timeline

All layouts use existing theme variables for contrast and inherit responsive behavior.

## Persistence

Current Supabase persistence stores core shared content in dedicated tables and variant presentation config in `portfolios`. Because custom content is shared, it cannot safely live only inside one variant's JSON config.

Add `profiles.custom_sections jsonb not null default '[]'::jsonb`.

- load maps the column into `PortfolioData.customSections`
- save/profile upsert writes it
- portfolio `section_config` already persists custom section config entries
- published snapshots include only the active portfolio data/config as usual

RLS does not change because the column stays on the existing owner-protected `profiles` row.

## Error handling

- Resume upload rejects unsupported types and files above 5 MB on both client and server.
- Empty/unreadable resumes return a concise parse error.
- Sparse resume extraction still opens review if useful fields were found.
- JSON validation errors are shown inline.
- Custom section/item empty fields are allowed during editing, but sections with no meaningful content do not render publicly.

## Testing

Test-first coverage must include:
- resume text parsing and duplicate-safe merge
- unsupported/empty resume handling
- JSON parse/validation/normalization
- custom section normalization, creation/removal behavior, snapshot inclusion, and render contract
- existing theme/publishing regressions

Final verification:
- `npm test`
- `npm run typecheck`
- `npm run build`
