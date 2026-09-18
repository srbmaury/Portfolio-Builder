# Resume Delivery, Hero Modal, Custom Layouts, and Section Ordering Design

## Goal

Make public resumes reliably viewable, optionally expose them from the hero in an accessible modal, expand custom-section layout choices, improve section ordering controls, and remove the portfolio-manager hydration mismatch.

## Current problems

- Public resume PDFs are stored as Cloudinary image assets and opened directly. Cloudinary Free environments can block direct PDF delivery, producing “Failed to load PDF document.”
- Resume presentation is limited to a dedicated section with Embedded/Card layouts.
- Custom sections have only List/Cards/Timeline layouts.
- Section ordering exists only as small up/down buttons inside each design card.
- `PortfolioManager` uses locale-dependent `toLocaleDateString()`, so server and browser locales can render different text during hydration.

## Design

### Resume delivery

Public portfolio pages will never embed the persisted Cloudinary URL directly. A server route will resolve the resume only from a published portfolio row and stream the PDF through FolioBlocks with `Content-Type: application/pdf` and inline disposition.

For existing Cloudinary image/PDF assets, the server will generate a signed Cloudinary authenticated download URL from the persisted public ID and proxy the bytes. This keeps already-uploaded resumes usable even if CDN PDF delivery is disabled.

New public resume uploads will use Cloudinary `raw/upload` so the original PDF is preserved without image transformations. Persisted resume configuration remains backward compatible.

### Hero resume modal

`PortfolioResume` gains `showInHero: boolean` with a legacy default of `false`. No SQL column is required because `resume_config` is JSONB.

When enabled and a resume exists, hero layouts render a “View résumé” action. The action is implemented by a focused client component that owns modal state, Escape/backdrop closing, focus trapping, and an “Open in new tab” fallback. Existing Resume section visibility and ordering remain independent.

### Custom-section templates

Expand custom layouts from 3 to 8:

- List
- Cards
- Timeline
- Grid
- Compact
- Split
- Spotlight
- Badges

Existing saved `list`, `cards`, and `timeline` variants remain unchanged. Unsupported values still normalize through the existing portfolio normalization path.

### Section ordering

Keep existing up/down controls for compatibility, and add a dedicated “Section order” control in the Design tab. It shows all sections in current order with visibility state and keyboard-friendly move controls. Reordering updates the same `config.sections` array used by published snapshots, so no schema change is required.

### Hydration-safe date formatting

Add a deterministic formatter that renders dates in a fixed English UTC format such as `18 Sep 2026`. Both server-rendered initial markup and client hydration therefore produce identical output regardless of browser locale.

## Error handling

- Resume route returns 404 for missing/unpublished portfolios or missing resume configuration.
- Cloudinary download failure returns a controlled 502 PDF-delivery error instead of an HTML error inside the iframe.
- Resume modal always includes a new-tab fallback.
- Upload errors stay non-destructive; the previous resume remains until a replacement upload succeeds.

## Testing

- Regression test for deterministic portfolio-manager dates.
- Resume-config normalization and snapshot tests for `showInHero`.
- Contract tests for published-resume proxy route and renderer using the proxy URL instead of persisted Cloudinary URL.
- Contract test that resume uploads target `raw/upload`.
- Renderer contract tests for hero modal trigger and accessibility.
- Custom-section tests for all eight allowed variants and preservation of existing variants.
- Section-order contract tests for dedicated ordering UI and underlying reorder action.
- Existing analytics, cleanup, typecheck, build, and Playwright suite must remain green.
