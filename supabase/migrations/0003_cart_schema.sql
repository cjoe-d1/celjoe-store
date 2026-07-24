begin;

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_chk check (quantity > 0)
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_product_id_idx on public.cart_items (product_id);
create index if not exists cart_items_variant_id_idx on public.cart_items (variant_id);
create unique index if not exists cart_items_cart_variant_uidx
on public.cart_items (cart_id, variant_id)
where variant_id is not null;

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.carts to anon, authenticated;
grant select, insert, update, delete on table public.cart_items to anon, authenticated;

create or replace function public.request_cart_token()
returns uuid
language sql
stable
as $$
  select nullif((current_setting('request.headers', true)::jsonb ->> 'x-cart-token'), '')::uuid;
$$;

drop policy if exists carts_by_token on public.carts;
create policy carts_by_token
on public.carts
for all
to public
using (token = public.request_cart_token())
with check (token = public.request_cart_token());

drop policy if exists cart_items_by_token on public.cart_items;
create policy cart_items_by_token
on public.cart_items
for all
to public
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.token = public.request_cart_token()
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.token = public.request_cart_token()
  )
);

commit;
