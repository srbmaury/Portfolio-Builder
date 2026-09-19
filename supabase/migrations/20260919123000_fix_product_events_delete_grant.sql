-- Deleting a portfolio cleans up that user's product_events rows, but every
-- attempt failed with 42501 "permission denied for table product_events" and
-- the whole DELETE /api/portfolios/[variantKey] request returned 500.
--
-- The earlier lifecycle migration granted DELETE and added an owner policy,
-- which is not sufficient: PostgreSQL also requires SELECT privilege on any
-- column referenced in a WHERE clause, and the cleanup filters on user_id and
-- variant_key. Grant SELECT on just those two columns so the filter can be
-- evaluated, without exposing event rows themselves.
--
-- No SELECT policy is added, so row level security still returns nothing if a
-- client tries to read the table directly.
grant select (user_id, variant_key) on table public.product_events to authenticated;

-- Re-assert the delete grant and owner policy so this migration repairs the
-- table on its own if the earlier one was never applied.
grant delete on table public.product_events to authenticated;

drop policy if exists product_events_owner_delete on public.product_events;
create policy product_events_owner_delete
on public.product_events
for delete
to authenticated
using ((select auth.uid()) = user_id);
