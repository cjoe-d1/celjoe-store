-- ==========================================================================
-- Phase E — Variants & Inventory: Schema Reconciliation
-- ==========================================================================
--
-- WHY: The live database is missing two columns on product_variants that
--      were defined in migrations 0014/0015 (is_available, position).
--      Additionally, service_role privileges may have been lost (as
--      discovered during the Phase 12 forensic investigation).
--
-- WHAT: Adds missing columns, backfills position, restores privileges,
--       and verifies the final state — without touching existing data.
--
-- SAFE TO RE-RUN: All DDL uses IF NOT EXISTS guards. GRANT is additive.
--
-- Columns added:
--   1. is_available (boolean, default true) — availability toggle
--   2. position (integer, default 0) — display ordering
--
-- Privileges granted:
--   service_role → SELECT, INSERT, UPDATE, DELETE
--   anon → SELECT
--   authenticated → SELECT
--
-- Business rule (enforced in app code):
--   stock_quantity = 0 → is_available = false
-- ==========================================================================

-- ── Step 1: Add missing columns ──────────────────────────────────

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_variants'
      and column_name = 'is_available'
  ) then
    alter table public.product_variants
      add column is_available boolean not null default true;
    raise notice '✓ Added product_variants.is_available';
  else
    raise notice '— product_variants.is_available already exists';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_variants'
      and column_name = 'position'
  ) then
    alter table public.product_variants
      add column position integer not null default 0;
    raise notice '✓ Added product_variants.position';
  else
    raise notice '— product_variants.position already exists';
  end if;
end $$;

-- ── Step 2: Backfill position for existing rows ──────────────────

do $$
declare
  rec record;
begin
  for rec in
    select product_id, id,
      row_number() over (
        partition by product_id order by created_at, id
      ) as new_position
    from public.product_variants
    where position = 0
  loop
    update public.product_variants
      set position = rec.new_position - 1  -- zero-based
      where id = rec.id;
  end loop;
  raise notice '✓ Backfilled positions for affected variants';
end $$;

-- ── Step 3: Backfill is_available for existing rows ──────────────

update public.product_variants
  set is_available = false
  where stock_quantity <= 0
    and is_available = true;

-- ── Step 4: Restore service_role privileges ──────────────────────

grant select, insert, update, delete
  on table public.product_variants
  to service_role;

-- ── Step 5: Restore public/authenticated read access ─────────────

grant select
  on table public.product_variants
  to anon, authenticated;

-- ── Step 6: Ensure RLS is enabled ────────────────────────────────

alter table public.product_variants enable row level security;

-- ── Step 7: Ensure RLS policies exist ────────────────────────────

-- Public read (storefront fetches variants)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_variants'
      and policyname = 'product_variants_public_read'
  ) then
    create policy product_variants_public_read
      on public.product_variants
      for select
      to anon, authenticated
      using (true);
    raise notice '✓ Created policy product_variants_public_read';
  else
    raise notice '— Policy product_variants_public_read already exists';
  end if;
end $$;

-- Admin full access (service_role bypasses RLS; authenticated admins need this)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_variants'
      and policyname = 'product_variants_admin_all'
  ) then
    create policy product_variants_admin_all
      on public.product_variants
      for all
      to authenticated
      using (true)
      with check (true);
    raise notice '✓ Created policy product_variants_admin_all';
  else
    raise notice '— Policy product_variants_admin_all already exists';
  end if;
end $$;

-- ── Step 8: Verification — columns ───────────────────────────────

select 'OK' as columns_check
from information_schema.columns
where table_schema = 'public'
  and table_name = 'product_variants'
  and column_name in ('is_available', 'position', 'stock_quantity')
having count(*) = 3;

-- ── Step 9: Verification — privileges ────────────────────────────

select
  has_table_privilege('service_role', 'public.product_variants', 'select') as sr_select,
  has_table_privilege('service_role', 'public.product_variants', 'insert') as sr_insert,
  has_table_privilege('service_role', 'public.product_variants', 'update') as sr_update,
  has_table_privilege('service_role', 'public.product_variants', 'delete') as sr_delete,
  has_table_privilege('anon', 'public.product_variants', 'select') as anon_select,
  has_table_privilege('authenticated', 'public.product_variants', 'select') as au_select;

-- All 6 results must be TRUE.

-- ── Step 10: Verification — RLS ──────────────────────────────────

select relname, relrowsecurity
from pg_class
where relname = 'product_variants';

-- Should return: product_variants | true

-- ==========================================================================
-- END OF MIGRATION
-- Execute in Supabase SQL Editor without modification.
-- ==========================================================================
