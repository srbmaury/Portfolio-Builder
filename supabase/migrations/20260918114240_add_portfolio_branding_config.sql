alter table public.portfolios
  add column if not exists branding_config jsonb not null default '{}'::jsonb;
