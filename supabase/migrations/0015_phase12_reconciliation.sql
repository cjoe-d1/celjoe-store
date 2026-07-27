-- ==========================================================================
-- Phase 12 RECONCILIATION MIGRATION — 0015
-- Project: Celjoe Hospitality Commerce Platform
-- Purpose:  Bring the live Supabase schema into exact alignment with the
--           approved Phase A–D architecture (per Blueorint.md v1.0).
-- Source:   Schema audit result (supabase/schema-audit.sql Section 14)
-- Strategy: Idempotent — safe to run more than once.
--           Preserves existing data where possible.
-- ==========================================================================

--------------------------------------------------------------------------------
-- 1. DROP products.image_url (Phase D moved images to product_images table)
--
--    The remnant check flagged this as ⚠ PRESENT. It must be removed because
--    the storefront now reads from product_images (Supabase Storage), and the
--    admin UI no longer exposes a URL textbox.
--------------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name  = 'products'
      and column_name = 'image_url'
  ) then
    alter table public.products drop column image_url;
    raise notice '  ✓ Dropped products.image_url';
  else
    raise notice '  → products.image_url already absent';
  end if;
end
$$;

--------------------------------------------------------------------------------
-- 2. DROP products.preparation_time_minutes (duplicate of preparation_minutes)
--
--    The database has TWO columns tracking preparation time. The frontend
--    (product-form.tsx) uses `preparation_minutes` (non-nullable) for Phase C.
--    The legacy `preparation_time_minutes` (nullable) is a dead column.
--------------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name  = 'products'
      and column_name = 'preparation_time_minutes'
  ) then
    alter table public.products drop column preparation_time_minutes;
    raise notice '  ✓ Dropped products.preparation_time_minutes';
  else
    raise notice '  → products.preparation_time_minutes already absent';
  end if;
end
$$;

--------------------------------------------------------------------------------
-- 3. ADD product_variants.is_available (Phase E — availability toggle)
--
--    Remnant check flagged ⚠ MISSING. Variants are rendered by VariantsEditor
--    which reads this column. Default: true (existing variants were available).
--------------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name  = 'product_variants'
      and column_name = 'is_available'
  ) then
    alter table public.product_variants
      add column is_available boolean not null default true;
    raise notice '  ✓ Added product_variants.is_available';
  else
    raise notice '  → product_variants.is_available already exists';
  end if;
end
$$;

--------------------------------------------------------------------------------
-- 4. ADD product_variants.position (Phase E — display order)
--
--    Remnant check flagged ⚠ MISSING. Required for variant ordering in the UI.
--    Existing variants get position = 0, new variants get incremented values.
--------------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name  = 'product_variants'
      and column_name = 'position'
  ) then
    alter table public.product_variants
      add column position integer not null default 0;
    raise notice '  ✓ Added product_variants.position';
  else
    raise notice '  → product_variants.position already exists';
  end if;
end
$$;

--------------------------------------------------------------------------------
-- 5. DROP activity_logs.admin_user_id (dead FK to admin_users)
--
--    The activity_logs table has a SET NULL FK to admin_users which is about
--    to be dropped. We must remove the column and its index before dropping
--    the referenced table. The audit_logs table (created in Phase A) is the
--    replacement audit system.
--------------------------------------------------------------------------------
do $$
begin
  -- Drop the index that includes this column
  if exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename  = 'activity_logs'
      and indexname  = 'activity_logs_admin_created_idx'
  ) then
    drop index public.activity_logs_admin_created_idx;
    raise notice '  ✓ Dropped index activity_logs_admin_created_idx';
  end if;

  -- Drop the foreign-key constraint (name may vary; find it dynamically)
  declare
    con_name text;
  begin
    select conname into con_name
      from pg_constraint
      where conrelid = 'public.activity_logs'::regclass
        and confrelid = 'public.admin_users'::regclass
        and contype = 'f'
      limit 1;
    if con_name is not null then
      execute format('alter table public.activity_logs drop constraint %I', con_name);
      raise notice '  ✓ Dropped FK constraint % on activity_logs', con_name;
    end if;
  end;

  -- Drop the column itself
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name  = 'activity_logs'
      and column_name = 'admin_user_id'
  ) then
    alter table public.activity_logs drop column admin_user_id;
    raise notice '  ✓ Dropped activity_logs.admin_user_id';
  else
    raise notice '  → activity_logs.admin_user_id already absent';
  end if;
end
$$;

---------------------------------------------------------------------------------
-- 6. DROP legacy tables (Phases A & C)
--
--    These tables belong to removed modules (Riders, Staff, Ingredients,
--    Suppliers, Stock Movements) or legacy auth structures. All FK references
--    are resolved above. CASCADE ensures any dangling references are cleaned.
--
--    admin_users   — Phase A replaced with celjoe_session cookie auth
--    ingredients   — Phase C removed; no longer referenced by frontend
--    suppliers     — Phase C removed
--    stock_movements — Phase C removed
---------------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_users'
  ) then
    drop table public.admin_users cascade;
    raise notice '  ✓ Dropped table admin_users';
  else
    raise notice '  → admin_users already absent';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ingredients'
  ) then
    drop table public.ingredients cascade;
    raise notice '  ✓ Dropped table ingredients';
  else
    raise notice '  → ingredients already absent';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'suppliers'
  ) then
    drop table public.suppliers cascade;
    raise notice '  ✓ Dropped table suppliers';
  else
    raise notice '  → suppliers already absent';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'stock_movements'
  ) then
    drop table public.stock_movements cascade;
    raise notice '  ✓ Dropped table stock_movements';
  else
    raise notice '  → stock_movements already absent';
  end if;
end
$$;

--------------------------------------------------------------------------------
-- 7. Backfill product_variants.position for existing rows
--
--    After adding the column (step 4), existing variants all have position = 0.
--    Assign sequential values within each product so the UI doesn't show ties.
--------------------------------------------------------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select product_id, id, row_number() over (
      partition by product_id order by created_at, id
    ) as new_position
    from public.product_variants
    where position = 0
  loop
    update public.product_variants
      set position = rec.new_position - 1  -- zero-based
      where id = rec.id;
  end loop;
end
$$;

--------------------------------------------------------------------------------
-- 8. NOTICE: order_status enum
--
--    The `order_status` enum still contains `out_for_delivery` and `delivered`
--    alongside `completed`. PostgreSQL does not support removing individual
--    enum values without dropping and recreating the type (which requires a
--    table lock and data migration). The CHECK constraint already enforces the
--    6-state pipeline:
--
--      order_status = ANY(ARRAY['pending','confirmed','preparing','ready','completed','cancelled'])
--
--    This is safe to leave as-is. Future rows cannot be inserted with the old
--    values, and existing rows with `out_for_delivery` or `delivered` should
--    have been backfilled to `completed` by migration 0010.
--------------------------------------------------------------------------------
do $$
begin
  raise notice '  ⓘ order_status enum retains out_for_delivery, delivered — CHECK constraint blocks them. No action needed.';
end
$$;

--------------------------------------------------------------------------------
-- VERIFICATION: Re-run the audit after applying this migration.
-- Expected results:
--
--   Section 1  — admin_users, ingredients, suppliers, stock_movements ABSENT
--   Section 2  — products.image_url ABSENT
--   Section 2  — products.preparation_time_minutes ABSENT
--   Section 2  — product_variants.is_available PRESENT
--   Section 2  — product_variants.position PRESENT
--   Section 14 — All dropped-table checks report ✓ ABSENT
--   Section 14 — product_variants.is_available → ✓ PRESENT
--   Section 14 — product_variants.position → ✓ PRESENT
--   Section 14 — products.image_url → ✓ ABSENT
--------------------------------------------------------------------------------
