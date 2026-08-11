-- Stage 3 — Customer Identity RLS Fix
--
-- Removes the overly broad customers_read_staff policy that allowed every
-- authenticated user to read every customer's personal information.
--
-- Adds properly scoped policies:
--   - customers: self-only INSERT (was missing)
--   - customer_addresses: self-only INSERT, UPDATE, DELETE (were missing)
--   - customer_addresses: self-only SELECT (replacing broad read)
--
-- Admin/service-role paths bypass RLS by design and are unaffected.

begin;

-- =========================================================================
-- CUSTOMERS — tighten SELECT, add INSERT
-- =========================================================================

-- Remove the broad policy that lets any authenticated user read any customer.
drop policy if exists customers_read_staff on public.customers;

-- Re-assert self-only SELECT (already exists from 0009, idempotent).
drop policy if exists customers_self_read on public.customers;
create policy customers_self_read
  on public.customers
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

-- Self-only UPDATE (already exists from 0009, idempotent).
drop policy if exists customers_self_update on public.customers;
create policy customers_self_update
  on public.customers
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- NEW: Self-only INSERT — was missing entirely, blocking getOrCreateCustomerId
-- from creating a row for newly registered users.
drop policy if exists customers_self_insert on public.customers;
create policy customers_self_insert
  on public.customers
  for insert
  to authenticated
  with check (auth.uid() = auth_user_id);

-- =========================================================================
-- CUSTOMER ADDRESSES — replace broad read, add INSERT / UPDATE / DELETE
-- =========================================================================

-- Remove the broad "any authenticated user can read all addresses" policy.
drop policy if exists customer_addresses_read on public.customer_addresses;

-- Self-only SELECT: customer can only read addresses linked to their own
-- customer record.
drop policy if exists customer_addresses_self_select on public.customer_addresses;
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

-- Self-only INSERT: customer can only create addresses for their own record.
drop policy if exists customer_addresses_self_insert on public.customer_addresses;
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

-- Self-only UPDATE: customer can only modify their own addresses.
drop policy if exists customer_addresses_self_update on public.customer_addresses;
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

-- Self-only DELETE: customer can only remove their own addresses.
drop policy if exists customer_addresses_self_delete on public.customer_addresses;
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
