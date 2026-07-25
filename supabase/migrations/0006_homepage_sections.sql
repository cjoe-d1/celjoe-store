begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'homepage_section_type') then
    create type public.homepage_section_type as enum (
      'hero',
      'todays_kitchen',
      'curated_categories',
      'chefs_table',
      'smokehouse',
      'catering',
      'celjoe_standard',
      'guest_stories',
      'final_invitation'
    );
  end if;
end $$;

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_type public.homepage_section_type not null,
  display_order integer not null default 0,
  is_enabled boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_sections_section_type_uidx unique (section_type)
);

create index if not exists homepage_sections_enabled_order_idx
on public.homepage_sections (is_enabled, display_order asc);

create trigger homepage_sections_set_updated_at
before update on public.homepage_sections
for each row execute function public.set_updated_at();

alter table public.homepage_sections enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.homepage_sections to anon, authenticated;

drop policy if exists homepage_sections_public_read on public.homepage_sections;
create policy homepage_sections_public_read
on public.homepage_sections
for select
to public
using (is_enabled = true);

drop policy if exists homepage_sections_admin_all on public.homepage_sections;
create policy homepage_sections_admin_all
on public.homepage_sections
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;

