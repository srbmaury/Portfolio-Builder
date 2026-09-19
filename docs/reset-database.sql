-- FolioBlocks: pending migrations + full data reset
--
-- Run this in the Supabase dashboard -> SQL Editor, as one script.
-- It is written to be safe to run more than once.
--
-- It does NOT touch auth.users, so your login (and therefore your
-- ADMIN_EMAIL admin access) survives. Demo content on the landing page and
-- the builder's "Load demo" come from code, not the database, so they keep
-- working against an empty schema.
--
-- It does NOT delete Cloudinary uploads. See the note at the bottom.

begin;

-- ---------------------------------------------------------------------------
-- 1. Fix portfolio deletion (migration 20260919123000)
--
-- Deleting a portfolio cleans up that user's product_events rows and failed
-- with 42501 "permission denied for table product_events", so every delete
-- returned 500. Granting DELETE alone is not enough: Postgres also needs
-- SELECT privilege on columns referenced in a WHERE clause, and the cleanup
-- filters on user_id and variant_key. No SELECT policy is added, so RLS still
-- returns nothing to a client reading the table directly.
-- ---------------------------------------------------------------------------
grant select (user_id, variant_key) on table public.product_events to authenticated;
grant delete on table public.product_events to authenticated;

drop policy if exists product_events_owner_delete on public.product_events;
create policy product_events_owner_delete
on public.product_events
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. Retire the analytics_admins allowlist (migration 20260919120000)
--
-- Admin access is now decided solely by the ADMIN_EMAIL environment variable,
-- checked in the app and in the admin-analytics edge function.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can verify their own membership" on public.analytics_admins;
revoke all on table public.analytics_admins from anon, authenticated;
drop table if exists public.analytics_admins;

-- ---------------------------------------------------------------------------
-- 3. Clear all application data
--
-- truncate ... cascade empties every table in one statement and ignores
-- foreign key ordering between them.
-- ---------------------------------------------------------------------------
truncate table
  public.analytics_events,
  public.product_events,
  public.portfolios,
  public.projects,
  public.experiences,
  public.skills,
  public.profiles
restart identity cascade;

commit;

-- ---------------------------------------------------------------------------
-- 4. Verify: every count below should be 0
-- ---------------------------------------------------------------------------
select 'analytics_events' as table_name, count(*) from public.analytics_events
union all select 'product_events',  count(*) from public.product_events
union all select 'portfolios',      count(*) from public.portfolios
union all select 'projects',        count(*) from public.projects
union all select 'experiences',     count(*) from public.experiences
union all select 'skills',          count(*) from public.skills
union all select 'profiles',        count(*) from public.profiles
order by table_name;

-- Confirm the allowlist table is gone (expect 0 rows):
select tablename from pg_tables
where schemaname = 'public' and tablename = 'analytics_admins';

-- Confirm your login survived (expect your account):
select email, created_at from auth.users order by created_at;

-- ---------------------------------------------------------------------------
-- Cloudinary
--
-- Uploaded images and resumes live in Cloudinary, not Postgres, so this script
-- leaves them orphaned. The app deletes them through the portfolio-delete and
-- delete-account paths, which no longer have rows to work from. To clear them,
-- delete the folioblocks/ folder in the Cloudinary Media Library, or leave
-- them; nothing references them any more.
-- ---------------------------------------------------------------------------
