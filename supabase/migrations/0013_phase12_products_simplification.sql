-- Phase 12 / Phase C — Products Simplification
--
-- The Blueprint's Phase C removes the following fields from products:
--   * SKU
--   * Barcode
--   * Cost Price
--   * Compare Price
--   * Visibility
--   * Experience
--   * Manual SEO (seo_title, seo_description)
--
-- These columns are dropped from the products table. Auto SEO continues
-- to write to seo_title / seo_description (computed from name +
-- short_description), so the columns are NOT removed from the schema
-- — they are simply no longer settable from the admin form.
--
-- This migration is idempotent: every DROP uses IF EXISTS.
--
-- IMPORTANT: Before running this migration, ensure that:
--   1. The storefront baseSelect (lib/supabase/products.ts) no longer
--      references the dropped columns.
--   2. The admin form no longer submits the dropped fields.
--   3. Server actions no longer write to the dropped columns.
-- The migration itself is safe (IF EXISTS) but client code that still
-- tries to SELECT a non-existent column will fail with
-- "column does not exist".

do $$
begin
  -- Drop the explicitly removed columns
  if public.has_column('products', 'sku') then
    alter table public.products drop column sku;
  end if;
  if public.has_column('products', 'barcode') then
    alter table public.products drop column barcode;
  end if;
  if public.has_column('products', 'cost_price') then
    alter table public.products drop column cost_price;
  end if;
  if public.has_column('products', 'compare_price') then
    alter table public.products drop column compare_price;
  end if;
  if public.has_column('products', 'visibility') then
    alter table public.products drop column visibility;
  end if;
  if public.has_column('products', 'experience') then
    alter table public.products drop column experience;
  end if;

  -- seo_title and seo_description are KEPT (auto-SEO writes to them)
  -- but no admin input is collected for them any more.
  -- If a future phase requires dropping them, this is the place.
end
$$;
