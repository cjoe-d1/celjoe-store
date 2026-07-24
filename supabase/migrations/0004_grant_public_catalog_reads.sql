begin;

grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.product_images to anon, authenticated;
grant select on table public.product_variants to anon, authenticated;
grant select on table public.addons to anon, authenticated;
grant select on table public.product_addons to anon, authenticated;

commit;
