create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (
    event_type = any (array[
      'builder_opened'::text,
      'resume_import_started'::text,
      'resume_import_succeeded'::text,
      'resume_import_failed'::text,
      'portfolio_created'::text,
      'workspace_saved'::text,
      'portfolio_published'::text
    ])
  ),
  variant_key text,
  created_at timestamptz not null default now()
);

alter table public.product_events enable row level security;

create policy product_events_owner_insert
on public.product_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on table public.product_events from anon;
revoke all on table public.product_events from authenticated;
grant insert on table public.product_events to authenticated;
grant select, insert, update, delete on table public.product_events to service_role;

create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at desc);

create index if not exists product_events_type_created_idx
  on public.product_events (event_type, created_at desc);

create or replace function public.save_portfolio_workspace(payload jsonb)
returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_username text := nullif(trim(payload ->> 'username'), '');
  v_previous_username text;
  v_profile jsonb := coalesce(payload -> 'profile', '{}'::jsonb);
  v_variant jsonb;
  v_variant_key text;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if jsonb_typeof(payload) <> 'object' then
    raise exception 'Workspace payload must be an object.';
  end if;

  if v_username is null then
    raise exception 'Workspace username is required.';
  end if;

  select username into v_previous_username
  from public.profiles
  where user_id = v_user_id;

  insert into public.profiles (
    user_id,
    username,
    full_name,
    role,
    tagline,
    about,
    email,
    location,
    availability,
    hero_image_url,
    social_links,
    custom_sections,
    updated_at
  )
  values (
    v_user_id,
    v_username,
    coalesce(v_profile ->> 'name', ''),
    coalesce(v_profile ->> 'role', ''),
    coalesce(v_profile ->> 'tagline', ''),
    coalesce(v_profile ->> 'about', ''),
    coalesce(v_profile ->> 'email', ''),
    coalesce(v_profile ->> 'location', ''),
    coalesce(v_profile ->> 'availability', ''),
    coalesce(v_profile ->> 'heroImageUrl', ''),
    coalesce(v_profile -> 'socials', '[]'::jsonb),
    coalesce(payload -> 'customSections', '[]'::jsonb),
    now()
  )
  on conflict (user_id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    role = excluded.role,
    tagline = excluded.tagline,
    about = excluded.about,
    email = excluded.email,
    location = excluded.location,
    availability = excluded.availability,
    hero_image_url = excluded.hero_image_url,
    social_links = excluded.social_links,
    custom_sections = excluded.custom_sections,
    updated_at = now();

  if v_previous_username is distinct from v_username then
    update public.portfolios
    set
      public_path = v_username || '/' || slug,
      updated_at = now()
    where user_id = v_user_id
      and public_path is not null;
  end if;

  delete from public.experiences where user_id = v_user_id;

  insert into public.experiences (
    id,
    user_id,
    company,
    role,
    period,
    summary,
    sort_order
  )
  select
    coalesce(nullif(item.value ->> 'id', ''), gen_random_uuid()::text),
    v_user_id,
    coalesce(item.value ->> 'company', ''),
    coalesce(item.value ->> 'role', ''),
    coalesce(item.value ->> 'period', ''),
    coalesce(item.value ->> 'summary', ''),
    item.ordinality::integer - 1
  from jsonb_array_elements(coalesce(payload -> 'experience', '[]'::jsonb))
       with ordinality as item(value, ordinality);

  delete from public.projects where user_id = v_user_id;

  insert into public.projects (
    id,
    user_id,
    title,
    description,
    stack,
    image_url,
    github_url,
    live_url,
    sort_order
  )
  select
    coalesce(nullif(item.value ->> 'id', ''), gen_random_uuid()::text),
    v_user_id,
    coalesce(item.value ->> 'title', ''),
    coalesce(item.value ->> 'description', ''),
    array(
      select jsonb_array_elements_text(
        coalesce(item.value -> 'stack', '[]'::jsonb)
      )
    ),
    nullif(item.value ->> 'imageUrl', ''),
    nullif(item.value ->> 'githubUrl', ''),
    nullif(item.value ->> 'liveUrl', ''),
    item.ordinality::integer - 1
  from jsonb_array_elements(coalesce(payload -> 'projects', '[]'::jsonb))
       with ordinality as item(value, ordinality);

  delete from public.skills where user_id = v_user_id;

  insert into public.skills (
    user_id,
    name,
    sort_order
  )
  select
    v_user_id,
    skill.value,
    skill.ordinality::integer - 1
  from jsonb_array_elements_text(coalesce(payload -> 'skills', '[]'::jsonb))
       with ordinality as skill(value, ordinality)
  where trim(skill.value) <> '';

  for v_variant in
    select value
    from jsonb_array_elements(coalesce(payload -> 'variants', '[]'::jsonb))
  loop
    v_variant_key := nullif(v_variant ->> 'id', '');

    if v_variant_key is null then
      raise exception 'Every portfolio variant requires an id.';
    end if;

    select slug into v_slug
    from public.portfolios
    where user_id = v_user_id
      and variant_key = v_variant_key;

    v_slug := coalesce(v_slug, nullif(v_variant ->> 'slug', ''));

    if v_slug is null then
      raise exception 'Every new portfolio variant requires a slug.';
    end if;

    insert into public.portfolios (
      user_id,
      variant_key,
      name,
      slug,
      target_role,
      theme,
      section_config,
      content_config,
      branding_config,
      resume_config,
      updated_at
    )
    values (
      v_user_id,
      v_variant_key,
      coalesce(v_variant ->> 'name', 'Untitled portfolio'),
      v_slug,
      coalesce(v_variant ->> 'targetRole', ''),
      coalesce(v_variant ->> 'theme', 'ink'),
      coalesce(v_variant -> 'sections', '[]'::jsonb),
      coalesce(
        v_variant -> 'content',
        '{"experienceIds":[],"projectIds":[],"skills":[]}'::jsonb
      ),
      coalesce(v_variant -> 'branding', '{}'::jsonb),
      coalesce(v_variant -> 'resume', '{}'::jsonb),
      now()
    )
    on conflict (user_id, variant_key) do update set
      name = excluded.name,
      target_role = excluded.target_role,
      theme = excluded.theme,
      section_config = excluded.section_config,
      content_config = excluded.content_config,
      branding_config = excluded.branding_config,
      resume_config = excluded.resume_config,
      updated_at = now();
  end loop;

  return v_username;
end;
$function$;

revoke execute on function public.save_portfolio_workspace(jsonb)
from public, anon;

grant execute on function public.save_portfolio_workspace(jsonb)
to authenticated, service_role;
