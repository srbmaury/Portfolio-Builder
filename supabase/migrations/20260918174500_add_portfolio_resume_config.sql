alter table public.portfolios
  add column if not exists resume_config jsonb not null default '{}'::jsonb;
