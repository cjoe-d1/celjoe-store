-- Paystack Payment Gateway — Database Setup
--
-- Stage 1: Create the payments infrastructure.
-- All payment operations go through server-side actions using
-- the service-role key.  No anon/authenticated RLS policies are
-- created — the browser must never directly access payments or
-- create/update orders.

begin;

-- =========================================================================
-- 1. Add missing customer/delivery fields to orders
-- =========================================================================
do $$
begin
  if not public.has_column('orders', 'customer_name') then
    alter table public.orders add column customer_name text;
  end if;
  if not public.has_column('orders', 'customer_email') then
    alter table public.orders add column customer_email text;
  end if;
  if not public.has_column('orders', 'customer_phone') then
    alter table public.orders add column customer_phone text;
  end if;
  if not public.has_column('orders', 'payment_reference') then
    alter table public.orders add column payment_reference text;
  end if;
  if not public.has_column('orders', 'delivery_method') then
    alter table public.orders add column delivery_method text;
  end if;
end
$$;

-- =========================================================================
-- 2. Payments table
-- =========================================================================
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null,
  order_id         uuid not null references public.orders(id) on delete restrict,
  amount           numeric(12,2) not null,
  amount_verified  numeric(12,2),
  currency         text not null default 'NGN',
  status           text not null default 'pending',
  channel          text,
  email            text,
  customer_name    text,
  customer_phone   text,
  order_type       text not null default 'product',
  paystack_data    jsonb,
  processed_at     timestamptz,
  processed_by     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- =========================================================================
-- 3. Indexes
-- =========================================================================
create unique index if not exists payments_reference_idx
  on public.payments(reference);

create index if not exists payments_order_id_idx
  on public.payments(order_id);

create index if not exists payments_status_idx
  on public.payments(status);

-- Prevent duplicate successful payments per order (enforced at DB level)
create unique index if not exists payments_one_success_per_order
  on public.payments(order_id)
  where status = 'completed';

-- =========================================================================
-- 4. RLS on payments
-- =========================================================================
alter table public.payments enable row level security;

-- No SELECT / INSERT / UPDATE / DELETE policies are created for
-- anon or authenticated roles.  Every payment operation uses the
-- service-role key via server-side actions (lib/supabase/admin).
-- The browser can NEVER query or modify the payments table directly.

commit;
