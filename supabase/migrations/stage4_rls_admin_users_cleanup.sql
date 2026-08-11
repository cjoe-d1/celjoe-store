-- Stage 4 — RLS Cleanup: Remove Stale admin_users References
--
-- Background:
--   Migration 0015 dropped the admin_users table (Phase A removal), but
--   RLS policies on the customers table may still reference it.  When an
--   authenticated customer queries their own customer record, Supabase
--   evaluates ALL applicable policies — if any policy references a dropped
--   table, the entire query fails with:
--     relation "public.admin_users" does not exist
--
-- Fix:
--   1. Drop ALL existing policies on customers (both known and stale).
--   2. Drop ALL existing policies on customer_addresses.
--   3. Recreate only the self-access policies needed by the application.
--   4. Admin/service-role paths bypass RLS and are unaffected.

begin;

-- =========================================================================
-- CUSTOMERS — nuke everything and rebuild
-- =========================================================================

-- Drop every policy name that could exist (known + speculative).
-- "if exists" ensures no errors for those already removed.
drop policy if exists "customers_read_staff"       on public.customers;
drop policy if exists "customers_read_admin"       on public.customers;
drop policy if exists "customers_read_all"         on public.customers;
drop policy if exists "customers_read"             on public.customers;
drop policy if exists customers_self_read          on public.customers;
drop policy if exists customers_self_update        on public.customers;
drop policy if exists customers_self_insert        on public.customers;
drop policy if exists customers_self_delete        on public.customers;
drop policy if exists "customers_select_policy"    on public.customers;
drop policy if exists "customers_insert_policy"    on public.customers;
drop policy if exists "customers_update_policy"    on public.customers;
drop policy if exists "customers_delete_policy"    on public.customers;

-- Recreate only the self-access policies.
create policy customers_self_read
  on public.customers
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

create policy customers_self_update
  on public.customers
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy customers_self_insert
  on public.customers
  for insert
  to authenticated
  with check (auth.uid() = auth_user_id);

-- No DELETE policy — customers cannot delete themselves.

-- =========================================================================
-- CUSTOMER ADDRESSES — nuke everything and rebuild
-- =========================================================================

drop policy if exists customer_addresses_read             on public.customer_addresses;
drop policy if exists customer_addresses_self_select      on public.customer_addresses;
drop policy if exists customer_addresses_self_insert      on public.customer_addresses;
drop policy if exists customer_addresses_self_update      on public.customer_addresses;
drop policy if exists customer_addresses_self_delete      on public.customer_addresses;
drop policy if exists "customer_addresses_select_policy"  on public.customer_addresses;
drop policy if exists "customer_addresses_insert_policy"  on public.customer_addresses;
drop policy if exists "customer_addresses_update_policy"  on public.customer_addresses;
drop policy if exists "customer_addresses_delete_policy"  on public.customer_addresses;

-- Self-only SELECT: customer reads only their own addresses.
create policy customer_addresses_self_select
  on public.customer_addresses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = customer_addresses.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

-- Self-only INSERT: customer creates addresses for their own record.
create policy customer_addresses_self_insert
  on public.customer_addresses
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.customers
      where customers.id = customer_addresses.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

-- Self-only UPDATE: customer modifies only their own addresses.
create policy customer_addresses_self_update
  on public.customer_addresses
  for update
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = customer_addresses.customer_id
        and customers.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.customers
      where customers.id = customer_addresses.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

-- Self-only DELETE: customer removes only their own addresses.
create policy customer_addresses_self_delete
  on public.customer_addresses
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = customer_addresses.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

commit;
