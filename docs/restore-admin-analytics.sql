-- STOPGAP: unbreak /admin/analytics without deploying the edge function.
--
-- The deployed admin-analytics function is still the pre-ADMIN_EMAIL version.
-- It looks the caller up in public.analytics_admins, which the reset script
-- dropped, so it now fails with 500 "Admin verification failed."
--
-- This recreates just enough for that old function to work again. The function
-- reads the table with the service role, which bypasses row level security, so
-- no policies or grants are needed here.
--
-- Once the function is redeployed from supabase/functions/admin-analytics,
-- this table is unused again and can be dropped with:
--   drop table if exists public.analytics_admins;

create table if not exists public.analytics_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.analytics_admins enable row level security;
revoke all on table public.analytics_admins from anon, authenticated;

insert into public.analytics_admins (user_id)
select id from auth.users where email = 'srbmaury@gmail.com'
on conflict (user_id) do nothing;

-- Expect exactly one row, matching your account:
select u.email, a.created_at
from public.analytics_admins a
join auth.users u on u.id = a.user_id;
