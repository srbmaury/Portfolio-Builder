create policy product_events_owner_delete
on public.product_events
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant delete on table public.product_events to authenticated;
