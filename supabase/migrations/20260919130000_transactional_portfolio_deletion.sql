-- Portfolio deletion used to perform several independent Data API deletes.
-- A failure in the middle could leave the workspace partially removed.
-- Keep every database mutation in one Postgres statement so an exception rolls
-- the complete deletion back. External Cloudinary cleanup stays in the route
-- and runs only after this RPC commits successfully.

-- DELETE ... WHERE user_id / variant_key requires these filtered columns to be
-- selectable even though no SELECT RLS policy exposes product event rows.
grant select (user_id, variant_key) on table public.product_events to authenticated;
grant delete on table public.product_events to authenticated;

drop policy if exists product_events_owner_delete on public.product_events;
create policy product_events_owner_delete
on public.product_events
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.delete_portfolio_workspace(p_variant_key text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_target_content jsonb;
  v_remaining_count integer := 0;
  v_is_last boolean := false;

  v_target_experience_ids text[] := '{}'::text[];
  v_target_project_ids text[] := '{}'::text[];
  v_target_skills text[] := '{}'::text[];

  v_remaining_experience_ids text[] := '{}'::text[];
  v_remaining_project_ids text[] := '{}'::text[];
  v_remaining_skills text[] := '{}'::text[];

  v_orphaned_experience_ids text[] := '{}'::text[];
  v_orphaned_project_ids text[] := '{}'::text[];
  v_orphaned_skills text[] := '{}'::text[];
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_variant_key is null
     or btrim(p_variant_key) = ''
     or char_length(p_variant_key) > 160 then
    raise exception 'Invalid portfolio identifier.';
  end if;

  select p.content_config
  into v_target_content
  from public.portfolios p
  where p.user_id = v_user_id
    and p.variant_key = p_variant_key
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Portfolio not found.';
  end if;

  -- Serialize deletion against edits to this user's existing portfolio rows.
  perform 1
  from public.portfolios p
  where p.user_id = v_user_id
  for update;

  select count(*)
  into v_remaining_count
  from public.portfolios p
  where p.user_id = v_user_id
    and p.variant_key <> p_variant_key;

  v_is_last := v_remaining_count = 0;

  if v_is_last then
    delete from public.product_events
    where user_id = v_user_id;

    delete from public.experiences
    where user_id = v_user_id;

    delete from public.projects
    where user_id = v_user_id;

    delete from public.skills
    where user_id = v_user_id;

    delete from public.profiles
    where user_id = v_user_id;
  else
    select coalesce(array_agg(item.value), '{}'::text[])
    into v_target_experience_ids
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(v_target_content -> 'experienceIds') = 'array'
          then v_target_content -> 'experienceIds'
        else '[]'::jsonb
      end
    ) as item(value);

    select coalesce(array_agg(item.value), '{}'::text[])
    into v_target_project_ids
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(v_target_content -> 'projectIds') = 'array'
          then v_target_content -> 'projectIds'
        else '[]'::jsonb
      end
    ) as item(value);

    select coalesce(array_agg(item.value), '{}'::text[])
    into v_target_skills
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(v_target_content -> 'skills') = 'array'
          then v_target_content -> 'skills'
        else '[]'::jsonb
      end
    ) as item(value);

    select coalesce(array_agg(distinct item.value), '{}'::text[])
    into v_remaining_experience_ids
    from public.portfolios p
    cross join lateral jsonb_array_elements_text(
      case
        when jsonb_typeof(p.content_config -> 'experienceIds') = 'array'
          then p.content_config -> 'experienceIds'
        else '[]'::jsonb
      end
    ) as item(value)
    where p.user_id = v_user_id
      and p.variant_key <> p_variant_key;

    select coalesce(array_agg(distinct item.value), '{}'::text[])
    into v_remaining_project_ids
    from public.portfolios p
    cross join lateral jsonb_array_elements_text(
      case
        when jsonb_typeof(p.content_config -> 'projectIds') = 'array'
          then p.content_config -> 'projectIds'
        else '[]'::jsonb
      end
    ) as item(value)
    where p.user_id = v_user_id
      and p.variant_key <> p_variant_key;

    select coalesce(array_agg(distinct item.value), '{}'::text[])
    into v_remaining_skills
    from public.portfolios p
    cross join lateral jsonb_array_elements_text(
      case
        when jsonb_typeof(p.content_config -> 'skills') = 'array'
          then p.content_config -> 'skills'
        else '[]'::jsonb
      end
    ) as item(value)
    where p.user_id = v_user_id
      and p.variant_key <> p_variant_key;

    select coalesce(array_agg(item.value), '{}'::text[])
    into v_orphaned_experience_ids
    from unnest(v_target_experience_ids) as item(value)
    where not (item.value = any(v_remaining_experience_ids));

    select coalesce(array_agg(item.value), '{}'::text[])
    into v_orphaned_project_ids
    from unnest(v_target_project_ids) as item(value)
    where not (item.value = any(v_remaining_project_ids));

    select coalesce(array_agg(item.value), '{}'::text[])
    into v_orphaned_skills
    from unnest(v_target_skills) as item(value)
    where not (item.value = any(v_remaining_skills));

    delete from public.experiences
    where user_id = v_user_id
      and id = any(v_orphaned_experience_ids);

    delete from public.projects
    where user_id = v_user_id
      and id = any(v_orphaned_project_ids);

    delete from public.skills
    where user_id = v_user_id
      and name = any(v_orphaned_skills);

    delete from public.product_events
    where user_id = v_user_id
      and variant_key = p_variant_key;
  end if;

  -- analytics_events rows cascade from this portfolio delete.
  delete from public.portfolios
  where user_id = v_user_id
    and variant_key = p_variant_key;

  return jsonb_build_object(
    'deleted', true,
    'deletedSharedWorkspace', v_is_last,
    'productEventsCleaned', true
  );
end;
$function$;

revoke execute on function public.delete_portfolio_workspace(text)
from public, anon;

grant execute on function public.delete_portfolio_workspace(text)
to authenticated, service_role;
