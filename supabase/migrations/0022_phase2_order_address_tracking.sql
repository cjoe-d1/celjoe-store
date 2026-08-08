-- Phase 2 — Customer + Admin Order Lifecycle Repair
-- Stage 1: Add guest address fields, customer_id, and tracking_token to orders
--
-- This migration adds:
--  1. customer_id        — links order to customers table (NULL = guest)
--  2. address_line1      — guest delivery address line 1
--  3. city               — guest delivery city
--  4. state              — guest delivery state
--  5. delivery_instructions — guest delivery landmark/instructions
--  6. tracking_token     — cryptographically random token for secure guest tracking
--
-- All new columns use IF NOT EXISTS guards to avoid duplicate-column errors.
-- Existing rows are backfilled where necessary.

begin;

-- =========================================================================
-- 1. customer_id — nullable foreign key to customers table
-- =========================================================================
do $$
begin
  if not public.has_column('orders', 'customer_id') then
    alter table public.orders
      add column customer_id uuid
      references public.customers(id) on delete set null;

    create index if not exists orders_customer_id_idx
      on public.orders(customer_id)
      where customer_id is not null;
  end if;
end
$$;

-- =========================================================================
-- 2. Address fields (all nullable — only populated for delivery orders)
-- =========================================================================
do $$
begin
  if not public.has_column('orders', 'address_line1') then
    alter table public.orders add column address_line1 text;
  end if;

  if not public.has_column('orders', 'city') then
    alter table public.orders add column city text;
  end if;

  if not public.has_column('orders', 'state') then
    alter table public.orders add column state text;
  end if;

  if not public.has_column('orders', 'delivery_instructions') then
    alter table public.orders add column delivery_instructions text;
  end if;
end
$$;

-- =========================================================================
-- 3. tracking_token — cryptographically random, unique, NOT NULL
-- =========================================================================
do $$
begin
  if not public.has_column('orders', 'tracking_token') then
    -- Step 1: Add nullable column
    alter table public.orders add column tracking_token text;

    -- Step 2: Backfill existing rows with random UUIDs
    update public.orders
      set tracking_token = gen_random_uuid()::text
      where tracking_token is null;

    -- Step 3: Enforce NOT NULL and UNIQUE
    alter table public.orders
      alter column tracking_token set not null;

    create unique index if not exists orders_tracking_token_idx
      on public.orders(tracking_token);
  end if;
end
$$;

commit;
