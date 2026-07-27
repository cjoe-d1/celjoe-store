-- Phase 12 / Phase E — Variants & Inventory
--
-- Per the Phase 11 Implementation Blueprint:
--   Variant Fields:    Name, Price, Quantity, Available
--   Inventory Fields:  Quantity, Available
--   Rule:              Quantity = 0  ->  Unavailable
--
-- The product_variants table already exists from earlier migrations with
-- columns (id, product_id, name, price, is_available, position, image_url,
-- option_values, created_at, updated_at). This migration is purely additive
-- and idempotent — every ADD COLUMN uses IF NOT EXISTS.
--
-- We standardise the quantity column name on `stock_quantity` because that
-- is the name already used by the storefront lib/supabase/products.ts
-- (`stock_quantity`) and the cart data layer.

do $$
begin
  if public.has_table('product_variants') then
    -- 1) Ensure stock_quantity exists
    if not public.has_column('product_variants', 'stock_quantity') then
      alter table public.product_variants
        add column stock_quantity integer not null default 0;
    end if;

    -- 2) Ensure is_available exists (for storefront filtering)
    if not public.has_column('product_variants', 'is_available') then
      alter table public.product_variants
        add column is_available boolean not null default true;
    end if;

    -- 3) Ensure position (display order) exists
    if not public.has_column('product_variants', 'position') then
      alter table public.product_variants
        add column position integer not null default 0;
    end if;

    -- 4) Backfill: when stock_quantity is 0, mark the variant unavailable.
    --    This encodes the "Quantity = 0 -> Unavailable" rule from the
    --    blueprint at the database level.
    update public.product_variants
      set is_available = false
      where stock_quantity <= 0 and is_available = true;
  end if;

  -- 5) RLS for product_variants ------------------------------------------------
  if public.has_table('product_variants') then
    alter table public.product_variants enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'product_variants'
        and policyname = 'product_variants_public_read'
    ) then
      create policy product_variants_public_read
        on public.product_variants
        for select
        to anon, authenticated
        using (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'product_variants'
        and policyname = 'product_variants_admin_all'
    ) then
      create policy product_variants_admin_all
        on public.product_variants
        for all
        to authenticated
        using (true)
        with check (true);
    end if;
  end if;
end
$$;
