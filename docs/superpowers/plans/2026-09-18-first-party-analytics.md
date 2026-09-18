# First-Party Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-party portfolio analytics for creators and a product-wide admin analytics dashboard inside FolioBlocks.

**Architecture:** Public portfolio interactions are captured through a small Next.js analytics endpoint into a Supabase `analytics_events` table protected by RLS. Owner analytics are computed from rows the authenticated owner can select; product-wide admin analytics are returned by a JWT-protected Supabase Edge Function that verifies membership in `analytics_admins` before using service-role access.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Postgres/RLS/Auth/Edge Functions, existing FolioBlocks CSS system.

**Spec:** Inline product requirements approved in the 2026-09-18 conversation.

## Global Constraints

- Do not send portfolio content, resume text, names, emails, IP addresses, or full referrer URLs into analytics.
- Store only portfolio identity, fixed event type, opaque anonymous visitor/session UUIDs, coarse device type, sanitized target key, referrer hostname, and timestamp.
- De-duplicate `portfolio_view` to once per portfolio/session.
- Normal users can only read analytics for portfolios they own.
- Anonymous users can only insert events for currently published portfolios.
- Admin analytics must be gated server-side by an explicit admin allowlist table.
- No third-party analytics SDK.
- Admin service-role access stays inside Supabase Edge Functions.

---

### Task 1: Analytics domain model and tests
**Files:** Create `lib/analytics.ts`, `tests/analytics.test.mjs`.
- [ ] Write failing tests for input validation, referrer sanitization, event summarization, per-portfolio metrics, daily trend, device/referrer/action breakdown.
- [ ] Verify RED.
- [ ] Implement minimal pure analytics helpers.
- [ ] Verify GREEN.

### Task 2: Supabase analytics schema and RLS
**Files:** Create `supabase/migrations/20260918150000_add_first_party_analytics.sql`, `tests/analytics-schema.test.mjs`.
- [ ] Write source-contract tests for RLS/grants/check constraints/session-view uniqueness.
- [ ] Verify RED.
- [ ] Apply schema, verify policies/indexes, run advisors.
- [ ] Commit matching migration.
- [ ] Verify GREEN.

### Task 3: Public portfolio tracking
**Files:** Create `app/api/analytics/events/route.ts`, `components/PortfolioAnalyticsTracker.tsx`, modify public lookup/page/renderer, add tracking contract tests.
- [ ] Write failing contract tests.
- [ ] Verify RED.
- [ ] Implement endpoint, tracker, public lookup, and analytics attributes.
- [ ] Verify GREEN.

### Task 4: Creator analytics dashboard
**Files:** Create `lib/supabase/analytics-store.ts`, `app/analytics/page.tsx`, `components/AnalyticsDashboard.tsx`, modify PortfolioManager and CSS.
- [ ] Add failing dashboard/store contract tests.
- [ ] Verify RED.
- [ ] Implement owner-only query and dashboard.
- [ ] Add Analytics entry points from My Portfolios.
- [ ] Verify GREEN.

### Task 5: Admin analytics dashboard
**Files:** Create `supabase/functions/admin-analytics/index.ts`, `app/admin/analytics/page.tsx`, `components/AdminAnalyticsDashboard.tsx`, admin contract tests.
- [ ] Write failing security/contract tests.
- [ ] Verify RED.
- [ ] Implement/deploy function and admin page.
- [ ] Seed the current sole project user as the first admin.
- [ ] Verify function ACTIVE with JWT verification.

### Task 6: Integration verification
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Verify Supabase RLS policies and admin seed.
- [ ] Run Supabase advisors.
- [ ] Open PR and merge only if verification succeeds or report blockers.
