# Resume & Section UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reliably deliver resumes, add an optional hero resume modal, expand custom layouts, improve section ordering, and eliminate locale-driven hydration mismatches.

**Architecture:** Keep portfolio persistence backward compatible by extending existing JSON configuration only. Isolate public resume delivery behind a server route and modal behavior in a small client component; reuse the current section configuration array for ordering and the current custom-section renderer for new layouts.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Cloudinary, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-18-resume-modal-sections-design.md`

## Global Constraints

- No new SQL column for the hero resume option; use existing `resume_config` JSONB.
- Existing published snapshots and saved portfolios must normalize safely.
- Resume content must only be served for published portfolios.
- Existing portfolio deletion/Cloudinary cleanup guarantees must remain intact.
- Public resume analytics continue to use `resume_opened`.
- Date output must be deterministic across server and browser locales.

---

### Task 1: Restore green baseline

**Files:**
- Modify: `tests/analytics-dashboard-contract.test.mjs`
- Modify: `tests/analytics-schema.test.mjs`
- Modify: `tests/analytics-tracking-contract.test.mjs`

**Interfaces:**
- Consumes: current analytics page/dashboard/schema/tracker source.
- Produces: contract assertions aligned with current ownership and TypeScript syntax.

- [ ] Update stale assertions only; do not change analytics runtime behavior.
- [ ] Run `npm test` in CI and verify the four pre-existing failures disappear.
- [ ] Commit baseline test repairs.

### Task 2: Resume delivery and hero modal

**Files:**
- Modify: `tests/portfolio-resume.test.mjs`
- Create: `tests/resume-delivery-contract.test.mjs`
- Modify: `lib/portfolio.ts`
- Modify: `lib/cloudinary.ts`
- Modify: `lib/cloudinary-server.ts`
- Create: `app/api/public-resume/[portfolioId]/route.ts`
- Create: `components/ResumeModalLauncher.tsx`
- Modify: `components/PortfolioRenderer.tsx`
- Modify: `components/PortfolioBuilder.tsx`
- Modify: `components/builder/usePortfolioEditorActions.ts`
- Modify: `app/[username]/[portfolio]/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `PortfolioResume.showInHero: boolean`.
- Produces: public route `GET /api/public-resume/:portfolioId`.
- Produces: `ResumeModalLauncher({ url, fileName, label? })`.

- [ ] Add failing tests asserting legacy `showInHero=false`, snapshot preservation, raw upload endpoint, proxy route, and hero modal trigger.
- [ ] Verify the new tests fail for missing behavior.
- [ ] Extend resume normalization/default/clone logic.
- [ ] Upload new PDFs through Cloudinary `raw/upload`.
- [ ] Add server helper to obtain an authenticated Cloudinary original-download URL for legacy image PDFs.
- [ ] Add published-only resume proxy route that streams `application/pdf` inline.
- [ ] Pass the proxy URL from the public page to the renderer.
- [ ] Add accessible modal launcher and hero toggle UI.
- [ ] Route dedicated Resume section links/iframe through the public resume URL on published pages.
- [ ] Run unit tests, typecheck, build, and browser tests.

### Task 3: Custom-section layouts

**Files:**
- Modify: `tests/custom-sections.test.mjs`
- Modify: `lib/portfolio.ts`
- Modify: `components/PortfolioRenderer.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces custom variants: `list | cards | timeline | grid | compact | split | spotlight | badges`.

- [ ] Add failing test asserting all eight custom templates exist and normalize.
- [ ] Verify failure before implementation.
- [ ] Add five catalog entries.
- [ ] Implement renderer branches/classes for each new layout.
- [ ] Add responsive styles while preserving existing layout output.
- [ ] Run unit tests and typecheck.

### Task 4: Dedicated section ordering UI

**Files:**
- Create: `tests/section-order-contract.test.mjs`
- Modify: `components/PortfolioBuilder.tsx`
- Modify: `components/builder/usePortfolioEditorActions.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes existing `moveSection(index, direction)`.
- Produces a dedicated Design-tab Section order control with keyboard-accessible actions.

- [ ] Add failing contract test for the Section order control.
- [ ] Verify failure.
- [ ] Render ordered section rows before the detailed layout cards.
- [ ] Keep existing arrows in detailed cards for compatibility.
- [ ] Add responsive styles.
- [ ] Run tests/typecheck.

### Task 5: Hydration-safe portfolio dates

**Files:**
- Create: `lib/date-format.ts`
- Create: `tests/date-format.test.mjs`
- Modify: `components/PortfolioManager.tsx`

**Interfaces:**
- Produces: `formatPortfolioDate(value: string): string`.

- [ ] Add a failing test expecting `2026-09-18T00:00:00Z` to render exactly `18 Sep 2026`.
- [ ] Verify failure because the formatter does not exist.
- [ ] Implement UTC deterministic formatting with `Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })`.
- [ ] Replace locale-dependent rendering in PortfolioManager.
- [ ] Run unit tests and typecheck.

### Task 6: Final verification and merge

**Files:**
- Modify documentation only if behavior changed from the approved spec.

**Interfaces:**
- Consumes all prior tasks.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run Playwright E2E.
- [ ] Review the PR diff for resume privacy, backward compatibility, hydration safety, and deletion lifecycle.
- [ ] Merge only after the latest branch run reports the actual test/build status.
