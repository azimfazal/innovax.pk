-- Run this once in Supabase SQL Editor to enable the admin delete buttons
-- on an existing orders table. Admin role is required by the RLS policy.
grant usage on schema public to authenticated;
grant select, delete on table public.orders to authenticated;

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
