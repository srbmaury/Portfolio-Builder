-- Admin access is now granted by the ADMIN_EMAIL environment variable, checked
-- both in the Next.js app and in the admin-analytics edge function. Nothing
-- reads the allowlist table any more, so retire it rather than leaving a
-- second, silently ignored source of authorisation in the schema.
drop policy if exists "Admins can verify their own membership" on public.analytics_admins;

revoke all on table public.analytics_admins from anon, authenticated;

drop table if exists public.analytics_admins;
