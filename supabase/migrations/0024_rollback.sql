-- Rollback: Clear category image_url values set by migration 0024.
-- Run this if you need to revert the curated category images.

begin;

update public.categories
set image_url = null,
    updated_at = now()
where lower(slug) in ('kitchen', 'bbq', 'drinks', 'bakery', 'catering');

commit;
