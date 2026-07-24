begin;

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  content_html text not null,
  seo_title text,
  seo_description text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_pages_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists site_pages_slug_uidx on public.site_pages (slug);
create index if not exists site_pages_published_updated_idx on public.site_pages (published, updated_at desc);

create trigger site_pages_set_updated_at
before update on public.site_pages
for each row execute function public.set_updated_at();

alter table public.site_pages enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.site_pages to anon, authenticated;

drop policy if exists site_pages_public_read on public.site_pages;
create policy site_pages_public_read
on public.site_pages
for select
to public
using (published = true);

drop policy if exists site_pages_admin_all on public.site_pages;
create policy site_pages_admin_all
on public.site_pages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;

