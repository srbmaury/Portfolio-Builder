# Resume Import, JSON Editing, and Custom Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add resume import with review, an advanced workspace JSON editor, and reusable custom portfolio sections without breaking existing variants or publishing.

**Architecture:** Resume import is an in-memory server parsing flow that merges reviewed structured data into the existing shared portfolio content. JSON editing operates on the complete `BuilderState` through strict parsing plus `normalizeBuilderState`. Custom sections become first-class ordered section configs referencing shared custom-section content, with generic list/cards/timeline renderers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node route handlers, PDF/DOCX text extraction, existing Supabase persistence and published snapshots.

**Spec:** `docs/superpowers/specs/2026-09-18-resume-import-design.md`

## Global Constraints

- Resume files are parsed in memory and never persisted.
- Resume import accepts PDF and DOCX only.
- Invalid JSON must never replace builder state.
- Existing portfolio variants, branding, targeting, and publishing behavior must remain compatible.
- Custom-section content is shared; visibility/order/layout remain variant-specific.
- No unrelated product features or schema expansion.

---

### Task 1: Resume parser and merge model

**Files:**
- Create: `lib/resume-parser.ts`
- Create: `lib/resume-import.ts`
- Create: `tests/resume-import.test.mjs`

**Interfaces:**
- Produces: `ResumeImportDraft`, `parseResumeText(text)`, `mergeResumeImport(state, draft)`.

- [ ] Write failing tests for contact/section extraction and duplicate-safe merge.
- [ ] Run tests and confirm failure because the parser/merge modules do not exist.
- [ ] Implement minimal deterministic parsing and merge helpers.
- [ ] Run tests and confirm they pass.
- [ ] Commit.

### Task 2: Resume upload API and review UI

**Files:**
- Create: `app/api/resume/parse/route.ts`
- Create: `components/ResumeImportDialog.tsx`
- Modify: `components/PortfolioBuilder.tsx`
- Modify: `app/globals.css`
- Modify: `package.json`
- Modify: lockfile if dependency metadata changes.

**Interfaces:**
- Consumes: `parseResumeText`, `mergeResumeImport`.
- Produces: Content-tab “Import resume” action and editable review dialog.

- [ ] Add route validation/extraction tests where practical plus source-level regression assertions.
- [ ] Confirm tests fail before route/UI exists.
- [ ] Add PDF/DOCX extraction, file validation, loading/error states, editable review, and Apply behavior.
- [ ] Confirm tests pass.
- [ ] Commit.

### Task 3: Safe whole-workspace JSON editing

**Files:**
- Create: `lib/workspace-json.ts`
- Create: `components/WorkspaceJsonDialog.tsx`
- Create: `tests/workspace-json.test.mjs`
- Modify: `components/PortfolioBuilder.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `parseWorkspaceJson(text)` returning normalized `BuilderState` or a validation error.

- [ ] Write failing tests for invalid JSON rejection and valid normalized state application.
- [ ] Run tests and confirm failure.
- [ ] Implement parse/format helpers and Advanced JSON dialog with Format, Reset, Apply, and inline errors.
- [ ] Confirm tests pass.
- [ ] Commit.

### Task 4: First-class custom sections

**Files:**
- Modify: `lib/portfolio.ts`
- Modify: `components/PortfolioBuilder.tsx`
- Modify: `components/PortfolioRenderer.tsx`
- Modify: `lib/supabase/portfolio-store.ts` only if persistence mapping requires it.
- Modify: `app/globals.css`
- Create: `tests/custom-sections.test.mjs`

**Interfaces:**
- Adds `CustomSection` and `CustomSectionItem` shared content.
- Adds custom section configs with stable IDs and variants `list`, `cards`, and `timeline`.

- [ ] Write failing normalization/snapshot/render-contract tests.
- [ ] Run tests and confirm failure.
- [ ] Extend the data/config model, defaults, normalization, cloning, content detection, and snapshot logic.
- [ ] Add builder CRUD, reorder/show-hide/title/layout controls.
- [ ] Add public renderer variants.
- [ ] Confirm tests pass.
- [ ] Commit.

### Task 5: Integration and regression verification

**Files:**
- Modify tests as needed only for legitimate model updates.
- Review React components for accessibility, stable keys, and state ownership.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Verify published snapshots include custom section content and JSON/resume changes flow through existing save/publish.
- [ ] Open PR only after all checks pass.
