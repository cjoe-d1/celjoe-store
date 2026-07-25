-- Phase 9: Hospitality Operations Centre schema (idempotent)
--
-- This migration is deliberately additive and never destructive.
-- It only creates tables that don't yet exist, adds columns the
-- operations centre depends on (with `if not exists`), creates
-- indexes defensively, and recreates RLS policies without touching
-- pre-existing enum types (order_status, payment_status, payment_method).
--
-- Assumed production ecommerce schema (read-only, never modified):
--   public.orders(
--     id, order_number, order_status order_status_enum,
--     customer_name, customer_email, customer_phone,
--     subtotal numeric, delivery_fee numeric, tax numeric, total numeric,
--     payment_status payment_status_enum, payment_method payment_method_enum,
--     notes, created_at, updated_at, ...
--   )
--   public.order_items(
--     id, order_id fk -> orders.id, product_id, variant_id,
--     product_snapshot jsonb,  -- {name, slug, image_url, variant_name, ...}
--     quantity, unit_price numeric, line_total numeric
--   )
--   public.products, public.product_variants, public.categories (existing)

begin;

-- =========================================================================
-- Helper: check whether a column already exists
-- =========================================================================
create or replace function public.has_column(p_table text, p_column text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_column
  );
$$;

create or replace function public.has_table(p_table text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = p_table
  );
$$;

-- =========================================================================
-- ORDERS — additive columns only (do not recreate the table)
-- =========================================================================
do $$
begin
  if public.has_table('orders') then
    if not public.has_column('orders', 'assigned_rider_id') then
      alter table public.orders add column assigned_rider_id uuid;
    end if;
    if not public.has_column('orders', 'assigned_rider_name') then
      alter table public.orders add column assigned_rider_name text;
    end if;
    if not public.has_column('orders', 'preparation_minutes') then
      alter table public.orders add column preparation_minutes integer;
    end if;
    if not public.has_column('orders', 'cancelled_reason') then
      alter table public.orders add column cancelled_reason text;
    end if;
    if not public.has_column('orders', 'refunded_amount') then
      alter table public.orders add column refunded_amount numeric(12, 2);
    end if;
  end if;
end
$$;

create index if not exists orders_order_status_idx on public.orders (order_status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_assigned_rider_idx on public.orders (assigned_rider_id);

-- =========================================================================
-- RIDERS
-- =========================================================================
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  vehicle_type text not null default 'motorbike',
  status text not null default 'offline',
  active boolean not null default true,
  deliveries_count integer not null default 0,
  joined_at timestamptz not null default now()
);
create index if not exists riders_status_idx on public.riders (status);
create index if not exists riders_name_idx on public.riders (full_name);

-- =========================================================================
-- STAFF
-- =========================================================================
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role text not null default 'staff',
  department text not null default 'General',
  active boolean not null default true,
  joined_at timestamptz not null default now()
);
create index if not exists staff_email_idx on public.staff (email);
create index if not exists staff_role_idx on public.staff (role);

-- =========================================================================
-- CUSTOMERS
-- =========================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  phone text,
  orders_count integer not null default 0,
  total_spend numeric(12, 2) not null default 0,
  diet text[] not null default '{}',
  allergens text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists customers_email_idx on public.customers (email);

-- =========================================================================
-- INGREDIENTS & SUPPLIERS
-- =========================================================================
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists suppliers_name_idx on public.suppliers (name);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'unit',
  stock numeric(12, 2) not null default 0,
  low_stock_threshold numeric(12, 2) not null default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier text,
  expiry date,
  created_at timestamptz not null default now()
);
create index if not exists ingredients_name_idx on public.ingredients (name);
create index if not exists ingredients_supplier_idx on public.ingredients (supplier_id);

-- =========================================================================
-- AUDIT LOG
-- =========================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text not null,
  resource text not null,
  resource_id text,
  metadata jsonb,
  ip_address text,
  user_agent text
);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_email);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource);

-- =========================================================================
-- ROW LEVEL SECURITY (defensive, idempotent)
-- =========================================================================
alter table public.riders enable row level security;
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.ingredients enable row level security;
alter table public.suppliers enable row level security;
alter table public.audit_logs enable row level security;

-- Existing tables: only enable RLS if not already enabled. We do not
-- drop existing policies; the new policies are added with unique names.
do $$
begin
  if public.has_table('orders') then
    alter table public.orders enable row level security;
  end if;
  if public.has_table('order_items') then
    alter table public.order_items enable row level security;
  end if;
end
$$;

-- New tables: drop-then-create so re-runs succeed.
drop policy if exists "riders_read_staff" on public.riders;
create policy "riders_read_staff" on public.riders
  for select to authenticated using (true);

drop policy if exists "staff_read_staff" on public.staff;
create policy "staff_read_staff" on public.staff
  for select to authenticated using (true);

drop policy if exists "customers_read_staff" on public.customers;
create policy "customers_read_staff" on public.customers
  for select to authenticated using (true);

drop policy if exists "ingredients_read_staff" on public.ingredients;
create policy "ingredients_read_staff" on public.ingredients
  for select to authenticated using (true);

drop policy if exists "suppliers_read_staff" on public.suppliers;
create policy "suppliers_read_staff" on public.suppliers
  for select to authenticated using (true);

drop policy if exists "audit_logs_read_staff" on public.audit_logs;
create policy "audit_logs_read_staff" on public.audit_logs
  for select to authenticated using (true);

-- Audit log writes are restricted to the service role; authenticated
-- users cannot insert directly. The application uses the service-role key.
drop policy if exists "audit_logs_insert_block" on public.audit_logs;
create policy "audit_logs_insert_block" on public.audit_logs
  for insert to authenticated with check (false);

-- Existing orders/order_items: add NEW policy names that don't collide
-- with whatever the production schema already has. We do not drop
-- existing policies.
drop policy if exists "ops_orders_read" on public.orders;
create policy "ops_orders_read" on public.orders
  for select to authenticated using (true);

drop policy if exists "ops_orders_write" on public.orders;
create policy "ops_orders_write" on public.orders
  for all to authenticated using (true) with check (true);

drop policy if exists "ops_order_items_read" on public.order_items;
create policy "ops_order_items_read" on public.order_items
  for select to authenticated using (true);

commit;
