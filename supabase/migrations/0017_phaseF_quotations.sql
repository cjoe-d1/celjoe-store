begin;

-- ============================================================
-- Phase F — Quotations
-- ============================================================
-- Stores customer quotation requests submitted via the catering
-- form. Admin reviews, sets a quoted amount, and manages the
-- lifecycle: pending → quoted → accepted → completed | declined.
--
-- RLS design:
--   • anon / public can INSERT (customer form submission)
--   • authenticated (admin) can SELECT and UPDATE
--   • no DELETE — quotations are retained for audit
-- ============================================================

-- 1. Table ---------------------------------------------------

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  event_type text,
  guest_count integer,
  event_date date,
  notes text,
  status text not null default 'pending'
    check (status in ('pending','quoted','accepted','completed','declined')),
  admin_notes text,
  quoted_amount numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Indexes ----------------------------------------------------

create index if not exists quotations_status_idx on public.quotations (status);
create index if not exists quotations_created_at_idx on public.quotations (created_at desc);

-- Auto quote-number function ---------------------------------

create or replace function public.generate_quote_number()
returns text
language plpgsql
as $$
declare
  today text;
  seq  integer;
begin
  today := to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD');
  select coalesce(max(substring(quote_number from 'QT-\d{8}-(\d+)')::integer), 0) + 1
    into seq
    from public.quotations
   where quote_number like 'QT-' || today || '-%';
  return 'QT-' || today || '-' || lpad(seq::text, 4, '0');
end;
$$;

-- Auto-update trigger ----------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

-- 2. RLS -----------------------------------------------------

alter table public.quotations enable row level security;

-- Allow anonymous form submissions (insert only)
drop policy if exists quotations_anon_insert on public.quotations;
create policy quotations_anon_insert
  on public.quotations
  for insert
  to anon
  with check (true);

-- Allow admin (authenticated) read all
drop policy if exists quotations_auth_select on public.quotations;
create policy quotations_auth_select
  on public.quotations
  for select
  to authenticated
  using (true);

-- Allow admin (authenticated) update
drop policy if exists quotations_auth_update on public.quotations;
create policy quotations_auth_update
  on public.quotations
  for update
  to authenticated
  using (true)
  with check (true);

-- 3. Permissions ---------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.quotations
  to service_role;

grant insert
  on table public.quotations
  to anon;

grant select, update
  on table public.quotations
  to authenticated;

-- 4. Verify permissions --------------------------------------

select
  has_table_privilege('service_role', 'public.quotations', 'select')  as sr_select,
  has_table_privilege('service_role', 'public.quotations', 'insert')  as sr_insert,
  has_table_privilege('service_role', 'public.quotations', 'update')  as sr_update,
  has_table_privilege('service_role', 'public.quotations', 'delete')  as sr_delete;

-- 5. Verify RLS ----------------------------------------------

select
  relname,
  relrowsecurity
from pg_class
where relname = 'quotations';

commit;
