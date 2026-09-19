-- Content now belongs to the portfolio that shows it.
--
-- Until now one shared pool lived in profiles/experiences/projects/skills and
-- every portfolio selected from it, so editing one portfolio changed the
-- others. Each portfolio gets its own copy of that content instead.
--
-- The shared tables are deliberately left in place: they still back the
-- published username and remain the fallback for any row not yet migrated.

alter table public.portfolios
  add column if not exists data_config jsonb;

-- Backfill every existing portfolio with a snapshot of the pool as it stands,
-- so published output is unchanged and the copies only diverge from here.
update public.portfolios p
set data_config = jsonb_build_object(
  'profile', jsonb_build_object(
    'name', coalesce(pr.full_name, ''),
    'role', coalesce(pr.role, ''),
    'tagline', coalesce(pr.tagline, ''),
    'about', coalesce(pr.about, ''),
    'email', coalesce(pr.email, ''),
    'location', coalesce(pr.location, ''),
    'availability', coalesce(pr.availability, ''),
    'heroImageUrl', coalesce(pr.hero_image_url, ''),
    'socials', coalesce(pr.social_links, '[]'::jsonb)
  ),
  'experience', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', e.id, 'company', e.company, 'role', e.role,
      'period', e.period, 'summary', e.summary
    ) order by e.sort_order)
    from public.experiences e where e.user_id = p.user_id
  ), '[]'::jsonb),
  'projects', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', pj.id, 'title', pj.title, 'description', pj.description,
      'stack', coalesce(pj.stack, '[]'::jsonb),
      'imageUrl', coalesce(pj.image_url, ''),
      'githubUrl', coalesce(pj.github_url, ''),
      'liveUrl', coalesce(pj.live_url, '')
    ) order by pj.sort_order)
    from public.projects pj where pj.user_id = p.user_id
  ), '[]'::jsonb),
  'skills', coalesce((
    select jsonb_agg(s.name order by s.sort_order)
    from public.skills s where s.user_id = p.user_id
  ), '[]'::jsonb),
  'customSections', coalesce(pr.custom_sections, '[]'::jsonb)
)
from public.profiles pr
where pr.user_id = p.user_id
  and p.data_config is null;

-- Portfolios belonging to a user with no profile row still need valid content.
update public.portfolios
set data_config = jsonb_build_object(
  'profile', jsonb_build_object(
    'name', '', 'role', '', 'tagline', '', 'about', '', 'email', '',
    'location', '', 'availability', '', 'heroImageUrl', '', 'socials', '[]'::jsonb
  ),
  'experience', '[]'::jsonb,
  'projects', '[]'::jsonb,
  'skills', '[]'::jsonb,
  'customSections', '[]'::jsonb
)
where data_config is null;

-- Persist each portfolio's own content on save.
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
      data_config,
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
      v_variant -> 'data',
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
      -- Keep the stored copy when an older client saves without one.
      data_config = coalesce(excluded.data_config, public.portfolios.data_config),
      branding_config = excluded.branding_config,
      resume_config = excluded.resume_config,
      updated_at = now();
  end loop;

  return v_username;
end;
$function$;


