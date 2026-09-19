-- DevFolioX: delete all application data
--
-- Run in the Supabase dashboard -> SQL Editor. Safe to run more than once.
--
-- Keeps your login. auth.users is never touched, so the account and its
-- ADMIN_EMAIL admin access survive. Signing in afterwards gives you an empty
-- workspace rather than a locked door.
--
-- Keeps the schema. Only rows are removed; no table, column, policy or
-- function is dropped. Nothing here can break a deployed edge function.
--
-- Demo content is unaffected: the landing page and the builder's "Load demo"
-- read constants from lib/portfolio.ts, not the database.

begin;

-- ---------------------------------------------------------------------------
-- Every table the application writes to.
--
-- truncate ... cascade empties them in one statement and ignores foreign key
-- ordering between them. restart identity resets any sequence.
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
-- Verify. Every count should be 0, and your account should still be listed.
-- ---------------------------------------------------------------------------
select 'analytics_events' as table_name, count(*) from public.analytics_events
union all select 'product_events',  count(*) from public.product_events
union all select 'portfolios',      count(*) from public.portfolios
union all select 'projects',        count(*) from public.projects
union all select 'experiences',     count(*) from public.experiences
union all select 'skills',          count(*) from public.skills
union all select 'profiles',        count(*) from public.profiles
order by table_name;

select email, created_at from auth.users order by created_at;

-- ---------------------------------------------------------------------------
-- Cloudinary is separate storage
--
-- Uploaded images and résumés live in Cloudinary, not Postgres. Clearing rows
-- here leaves those files behind, and removes the references the app would
-- have used to clean them up later. To remove them too, delete the
-- folioblocks/ folder in the Cloudinary Media Library.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Not included, on purpose
--
-- Dropping public.analytics_admins belongs to the ADMIN_EMAIL migration, not
-- to a data reset. Bundling the two once took /admin/analytics down: the
-- deployed edge function still looked the caller up in that table, so
-- dropping it made every admin request fail. Deploy the function first:
--
--   npx supabase functions deploy admin-analytics --project-ref <ref>
--
-- and only then:  drop table if exists public.analytics_admins;
--
-- Adding portfolios.data_config also belongs to its own migration
-- (20260919160000_per_portfolio_content.sql). Until it is applied, each
-- portfolio's content is rebuilt from the shared tables on load, so the
-- portfolios re-merge. Publishing keeps working either way.
-- ---------------------------------------------------------------------------
