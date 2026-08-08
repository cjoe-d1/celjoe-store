-- Fix: Add anon RLS policies for orders and order_items
-- The browser analytics client uses the anon key, but existing RLS
-- policies only grant SELECT to `authenticated`. This mirrors the
-- existing `ops_orders_read` and `ops_order_items_read` policies
-- for the `anon` role.

begin;

drop policy if exists "ops_orders_read_anon" on public.orders;
create policy "ops_orders_read_anon" on public.orders
  for select to anon using (true);

drop policy if exists "ops_order_items_read_anon" on public.order_items;
create policy "ops_order_items_read_anon" on public.order_items
  for select to anon using (true);

commit;
