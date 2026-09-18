create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'portfolio_view',
      'resume_opened',
      'contact_clicked',
      'project_clicked',
      'social_clicked',
      'custom_link_clicked'
    )
  ),
  visitor_id uuid not null,
  session_id uuid not null,
  target text check (
    target is null or (
      char_length(target) between 1 and 120
      and target ~ '^[A-Za-z0-9:._-]+$'
    )
  ),
  referrer_host text not null default '' check (char_length(referrer_host) <= 255),
  device_type text not null default 'unknown' check (
    device_type in ('desktop', 'mobile', 'tablet', 'unknown')
  ),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_portfolio_created_idx
  on public.analytics_events (portfolio_id, created_at desc);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_created_idx
  on public.analytics_events (event_type, created_at desc);

create unique index if not exists analytics_events_view_session_unique
  on public.analytics_events (portfolio_id, session_id)
  where event_type = 'portfolio_view';

alter table public.analytics_events enable row level security;

drop policy if exists "Public can record published portfolio analytics" on public.analytics_events;
create policy "Public can record published portfolio analytics"
on public.analytics_events
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.portfolios p
    where p.id = analytics_events.portfolio_id
      and p.is_published = true
  )
);

drop policy if exists "Owners can read portfolio analytics" on public.analytics_events;
create policy "Owners can read portfolio analytics"
on public.analytics_events
for select
to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = analytics_events.portfolio_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on table public.analytics_events from anon, authenticated;
grant insert on table public.analytics_events to anon, authenticated;
grant select on table public.analytics_events to authenticated;

-- The public insert policy checks only these two portfolio columns.
-- Public portfolio content remains restricted to the existing published columns.
grant select (id, is_published) on table public.portfolios to anon;

create table if not exists public.analytics_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.analytics_admins enable row level security;

drop policy if exists "Admins can verify their own membership" on public.analytics_admins;
create policy "Admins can verify their own membership"
on public.analytics_admins
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.analytics_admins from anon, authenticated;
grant select on table public.analytics_admins to authenticated;

-- Bootstrap the current project owner without hard-coding a personal identifier.
insert into public.analytics_admins (user_id)
select id
from auth.users
where (select count(*) from auth.users) = 1
on conflict (user_id) do nothing;
