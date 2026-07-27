-- Phase 10: Operations Engine — additive schema (idempotent)
--
-- Extends the existing production schema with the missing tables and
-- columns needed by the operations engine. Never destructive, never
-- alters existing columns or enum types.

begin;

-- =========================================================================
-- PRODUCTS — additive columns only
-- =========================================================================
do $$
begin
  if public.has_table('products') then
    if not public.has_column('products', 'discount_price') then
      alter table public.products add column discount_price numeric(12, 2);
    end if;
    if not public.has_column('products', 'status') then
      alter table public.products add column status text not null default 'draft';
    end if;
    if not public.has_column('products', 'is_archived') then
      alter table public.products add column is_archived boolean not null default false;
    end if;
    if not public.has_column('products', 'gallery') then
      alter table public.products add column gallery jsonb not null default '[]'::jsonb;
    end if;
    if not public.has_column('products', 'seo_title') then
      alter table public.products add column seo_title text;
    end if;
    if not public.has_column('products', 'seo_description') then
      alter table public.products add column seo_description text;
    end if;
    if not public.has_column('products', 'visibility') then
      alter table public.products add column visibility text not null default 'public';
    end if;
    if not public.has_column('products', 'experience') then
      alter table public.products add column experience text not null default 'kitchen';
    end if;
    if not public.has_column('products', 'barcode') then
      alter table public.products add column barcode text;
    end if;
    if not public.has_column('products', 'cost_price') then
      alter table public.products add column cost_price numeric(12, 2);
    end if;
    if not public.has_column('products', 'compare_price') then
      alter table public.products add column compare_price numeric(12, 2);
    end if;
  end if;
end
$$;

create index if not exists products_status_idx on public.products (status);
create index if not exists products_archived_idx on public.products (is_archived);
create index if not exists products_experience_idx on public.products (experience);

-- =========================================================================
-- PRODUCT VARIANTS
-- =========================================================================
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null default 'Default',
  price numeric(12, 2) not null default 0,
  is_available boolean not null default true,
  image_url text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

-- =========================================================================
-- PRODUCT IMAGES
-- =========================================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id);

-- =========================================================================
-- CUSTOMERS — additive columns
-- =========================================================================
do $$
begin
  if public.has_table('customers') then
    if not public.has_column('customers', 'full_name') then
      alter table public.customers add column full_name text;
    end if;
    if not public.has_column('customers', 'phone') then
      alter table public.customers add column phone text;
    end if;
    if not public.has_column('customers', 'loyalty_tier') then
      alter table public.customers add column loyalty_tier text not null default 'regular';
    end if;
    if not public.has_column('customers', 'is_vip') then
      alter table public.customers add column is_vip boolean not null default false;
    end if;
    if not public.has_column('customers', 'is_blacklisted') then
      alter table public.customers add column is_blacklisted boolean not null default false;
    end if;
    if not public.has_column('customers', 'marketing_consent') then
      alter table public.customers add column marketing_consent boolean not null default false;
    end if;
    if not public.has_column('customers', 'tags') then
      alter table public.customers add column tags text[] not null default '{}';
    end if;
    if not public.has_column('customers', 'internal_notes') then
      alter table public.customers add column internal_notes text;
    end if;
    if not public.has_column('customers', 'updated_at') then
      alter table public.customers add column updated_at timestamptz not null default now();
    end if;
  end if;
end
$$;

-- =========================================================================
-- CUSTOMER ADDRESSES
-- =========================================================================
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists customer_addresses_customer_idx on public.customer_addresses (customer_id);

-- =========================================================================
-- ORDERS — additive columns
-- =========================================================================
do $$
begin
  if public.has_table('orders') then
    if not public.has_column('orders', 'customer_id') then
      alter table public.orders add column customer_id uuid;
    end if;
  end if;
end
$$;

-- =========================================================================
-- INGREDIENTS — additive columns
-- =========================================================================
do $$
begin
  if public.has_table('ingredients') then
    if not public.has_column('ingredients', 'cost_per_unit') then
      alter table public.ingredients add column cost_per_unit numeric(12, 2) not null default 0;
    end if;
  end if;
end
$$;

-- =========================================================================
-- SUPPLIERS — additive columns
-- =========================================================================
do $$
begin
  if public.has_table('suppliers') then
    if not public.has_column('suppliers', 'address') then
      alter table public.suppliers add column address text;
    end if;
  end if;
end
$$;

-- =========================================================================
-- STAFF — additive columns
-- =========================================================================
do $$
begin
  if public.has_table('staff') then
    if not public.has_column('staff', 'invited_at') then
      alter table public.staff add column invited_at timestamptz;
    end if;
    if not public.has_column('staff', 'invited_by') then
      alter table public.staff add column invited_by uuid;
    end if;
    if not public.has_column('staff', 'suspended_at') then
      alter table public.staff add column suspended_at timestamptz;
    end if;
    if not public.has_column('staff', 'deactivated_at') then
      alter table public.staff add column deactivated_at timestamptz;
    end if;
    if not public.has_column('staff', 'last_active_at') then
      alter table public.staff add column last_active_at timestamptz;
    end if;
    if not public.has_column('staff', 'updated_at') then
      alter table public.staff add column updated_at timestamptz not null default now();
    end if;
  end if;
end
$$;

-- =========================================================================
-- STOCK MOVEMENTS
-- =========================================================================
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  movement_type text not null,
  quantity numeric(12, 2) not null,
  unit_cost numeric(12, 2),
  supplier_id uuid references public.suppliers(id) on delete set null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_ingredient_idx on public.stock_movements (ingredient_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements (created_at desc);

-- =========================================================================
-- CMS — surfaces, versions, pages, navigation, promotions, testimonials
-- =========================================================================
create table if not exists public.cms_surfaces (
  surface text primary key,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  hero_image_url text,
  visibility text not null default 'draft',
  scheduled_for timestamptz,
  seo_title text,
  seo_description text,
  sections jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  published_at timestamptz,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
create index if not exists cms_surfaces_visibility_idx on public.cms_surfaces (visibility);

create table if not exists public.cms_versions (
  id uuid primary key default gen_random_uuid(),
  surface text not null,
  version integer not null,
  title text,
  body text,
  payload jsonb,
  archived_by uuid,
  archived_at timestamptz not null default now(),
  unique (surface, version)
);
create index if not exists cms_versions_surface_idx on public.cms_versions (surface, version desc);

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text not null default '',
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cms_pages_slug_idx on public.cms_pages (slug);

create table if not exists public.navigation (
  location text primary key,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  code text,
  discount_type text not null default 'percentage',
  discount_value numeric(12, 2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists promotions_active_idx on public.promotions (is_active);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  body text not null,
  rating integer not null default 5,
  image_url text,
  is_published boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists testimonials_published_idx on public.testimonials (is_published);

-- =========================================================================
-- SETTINGS (generic key/value)
-- =========================================================================
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.stock_movements enable row level security;
alter table public.cms_surfaces enable row level security;
alter table public.cms_versions enable row level security;
alter table public.cms_pages enable row level security;
alter table public.navigation enable row level security;
alter table public.promotions enable row level security;
alter table public.testimonials enable row level security;
alter table public.settings enable row level security;

drop policy if exists "product_variants_read" on public.product_variants;
create policy "product_variants_read" on public.product_variants for select to authenticated using (true);

drop policy if exists "product_images_read" on public.product_images;
create policy "product_images_read" on public.product_images for select to authenticated using (true);

drop policy if exists "customer_addresses_read" on public.customer_addresses;
create policy "customer_addresses_read" on public.customer_addresses for select to authenticated using (true);

drop policy if exists "stock_movements_read" on public.stock_movements;
create policy "stock_movements_read" on public.stock_movements for select to authenticated using (true);

drop policy if exists "cms_surfaces_read" on public.cms_surfaces;
create policy "cms_surfaces_read" on public.cms_surfaces for select to authenticated using (true);

drop policy if exists "cms_versions_read" on public.cms_versions;
create policy "cms_versions_read" on public.cms_versions for select to authenticated using (true);

drop policy if exists "cms_pages_read" on public.cms_pages;
create policy "cms_pages_read" on public.cms_pages for select to authenticated using (true);

drop policy if exists "navigation_read" on public.navigation;
create policy "navigation_read" on public.navigation for select to authenticated using (true);

drop policy if exists "promotions_read" on public.promotions;
create policy "promotions_read" on public.promotions for select to authenticated using (true);

drop policy if exists "testimonials_read" on public.testimonials;
create policy "testimonials_read" on public.testimonials for select to authenticated using (true);

drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings for select to authenticated using (true);

commit;
