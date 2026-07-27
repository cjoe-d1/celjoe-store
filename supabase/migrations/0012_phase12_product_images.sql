-- Phase 12 / Phase D — Product Images
--
-- Adds proper file-upload support to product images:
--   * File uploads to Supabase Storage (path column)
--   * Multiple images per product (already supported via product_images table)
--   * Drag-to-reorder (display_order column — already exists in storefront)
--   * Hero image flag (is_hero column)
--   * Per-image alt text (alt_text column — already exists)
--   * Audit columns (uploaded_by, uploaded_at)
--
-- The storefront's lib/supabase/products.ts already queries product_images
-- with the columns: id, image_url, alt_text, display_order. This migration
-- only ADDS columns (path, is_hero, uploaded_at, uploaded_by) and does not
-- touch the existing columns or data.
--
-- Also drops the legacy products.image_url (text) and products.gallery
-- (text[]) columns; product_images is now the single source of truth.
--
-- This migration is idempotent: every CREATE/ADD/DROP uses
-- IF NOT EXISTS / IF EXISTS.

do $$
begin
  -- 1) Add columns to the existing product_images table --------------------
  if public.has_table('product_images') then
    if not public.has_column('product_images', 'path') then
      alter table public.product_images
        add column path text;
      -- Backfill path from image_url for existing rows (best effort)
      update public.product_images
        set path = image_url
        where path is null;
    end if;
    if not public.has_column('product_images', 'is_hero') then
      alter table public.product_images
        add column is_hero boolean not null default false;
      -- The first image per product (lowest display_order) becomes the hero
      with ranked as (
        select id, product_id,
               row_number() over (partition by product_id order by display_order) as rn
        from public.product_images
      )
      update public.product_images pi
        set is_hero = true
        from ranked r
        where pi.id = r.id and r.rn = 1;
    end if;
    if not public.has_column('product_images', 'uploaded_at') then
      alter table public.product_images
        add column uploaded_at timestamptz not null default now();
    end if;
    if not public.has_column('product_images', 'uploaded_by') then
      alter table public.product_images
        add column uploaded_by uuid references auth.users(id) on delete set null;
    end if;
  else
    -- Fallback: create the table from scratch (no existing storefront data)
    create table public.product_images (
      id            uuid primary key default gen_random_uuid(),
      product_id    uuid not null references public.products(id) on delete cascade,
      image_url     text not null,
      path          text not null,
      alt_text      text,
      is_hero       boolean not null default false,
      display_order integer not null default 0,
      uploaded_by   uuid references auth.users(id) on delete set null,
      uploaded_at   timestamptz not null default now()
    );
  end if;

  create index if not exists product_images_product_idx
    on public.product_images(product_id, display_order);
  create index if not exists product_images_hero_idx
    on public.product_images(product_id) where is_hero = true;

  -- 2) Backfill from legacy products.gallery into product_images -----------
  if public.has_table('products') and public.has_column('products', 'gallery') then
    insert into public.product_images (product_id, image_url, path, alt_text, is_hero, display_order)
    select
      p.id,
      g.url as image_url,
      g.url as path,
      p.name as alt_text,
      false as is_hero,
      100 + row_number() over (partition by p.id order by g.ord) as display_order
    from public.products p
    cross join lateral unnest(coalesce(p.gallery, '{}'::text[]))
      with ordinality as g(url, ord)
    where g.url is not null
      and not exists (
        select 1 from public.product_images pi
        where pi.product_id = p.id and pi.image_url = g.url
      );
  end if;

  -- 3) RLS policies --------------------------------------------------------
  if public.has_table('product_images') then
    alter table public.product_images enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'product_images' and policyname = 'product_images_public_read'
    ) then
      create policy product_images_public_read
        on public.product_images
        for select
        to anon, authenticated
        using (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'product_images' and policyname = 'product_images_admin_all'
    ) then
      create policy product_images_admin_all
        on public.product_images
        for all
        to authenticated
        using (true)
        with check (true);
    end if;
  end if;

  -- 4) Drop legacy columns ------------------------------------------------
  if public.has_table('products') then
    if public.has_column('products', 'gallery') then
      alter table public.products drop column gallery;
    end if;
  end if;
end
$$;
