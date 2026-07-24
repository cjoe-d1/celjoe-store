begin;

-- Product tags
alter table public.products
add column if not exists tags text[] not null default '{}';

-- Product image alt text
alter table public.product_images
add column if not exists alt_text text;

-- Variant option values
alter table public.product_variants
add column if not exists option_values jsonb not null default '[]'::jsonb;

-- Search vector (regular column instead of generated)
alter table public.products
add column if not exists search_vector tsvector;

-- Populate existing rows
update public.products
set search_vector =
    to_tsvector(
        'simple',
        coalesce(name,'') || ' ' ||
        coalesce(short_description,'') || ' ' ||
        coalesce(description,'') || ' ' ||
        array_to_string(tags,' ')
    );

-- Indexes
create index if not exists products_search_vector_gin_idx
on public.products using gin(search_vector);

create index if not exists products_tags_gin_idx
on public.products using gin(tags);

-- Recursive category helper
create or replace function public.get_category_descendant_ids(root_slug text)
returns table(id uuid)
language sql
stable
as $$
with recursive tree as (
    select id
    from public.categories
    where slug = root_slug
      and is_active = true

    union all

    select c.id
    from public.categories c
    join tree t on c.parent_id = t.id
    where c.is_active = true
)
select id from tree;
$$;

commit;