alter table public.profiles
  add column if not exists custom_sections jsonb not null default '[]'::jsonb;
