-- Phase 12 / Phase A — Authentication Simplification
--
-- This migration is the schema-side support for the Phase A refactor.
-- It does not drop or rename any existing tables or columns.
-- It only adds what's needed for the customer account module:
--   - Link `customers` to `auth.users` via `auth_user_id` so customer
--     Server Actions can resolve the auth user to a `customers` row.
--   - Add the `instructions` column to `customer_addresses` so the
--     new addresses UI can persist rider/handoff notes.
--
-- The `customer_addresses` table itself already exists from migration
-- 0008 with line1 / line2 / city / state / postal_code / is_default.

begin;

do $$
begin
  if public.has_table('customers') then
    if not public.has_column('customers', 'auth_user_id') then
      alter table public.customers
        add column auth_user_id uuid references auth.users(id) on delete set null;
    end if;
    if not public.has_column('customers', 'updated_at') then
      alter table public.customers
        add column updated_at timestamptz not null default now();
    end if;
  end if;
end
$$;

create unique index if not exists customers_auth_user_uidx
  on public.customers (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if public.has_table('customer_addresses') then
    if not public.has_column('customer_addresses', 'instructions') then
      alter table public.customer_addresses add column instructions text;
    end if;
    if not public.has_column('customer_addresses', 'updated_at') then
      alter table public.customer_addresses
        add column updated_at timestamptz not null default now();
    end if;
  end if;
end
$$;

-- RLS for the new `auth_user_id` link: the row owner is the only person
-- allowed to read or modify their customer record.
alter table public.customers enable row level security;

drop policy if exists customers_self_read on public.customers;
create policy customers_self_read
  on public.customers
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

drop policy if exists customers_self_update on public.customers;
create policy customers_self_update
  on public.customers
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- The `customer_addresses` table is already RLS-enabled via the
-- operations policies; nothing else is required at this stage.

commit;
