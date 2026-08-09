-- Phase 3: Curated category images
--
-- Updates the five homepage curated categories with image URLs
-- sourced from the CELJOE Image Manifest (Unsplash, commercially licensed).
-- Categories are matched by slug (case-insensitive) and only updated
-- if the current image_url is NULL — existing images are preserved.

begin;

update public.categories
set image_url = '/images/home/celjoe-home-kitchen-preview.jpg',
    updated_at = now()
where lower(slug) = 'kitchen'
  and image_url is null;

update public.categories
set image_url = '/images/home/celjoe-home-bbq-preview.jpg',
    updated_at = now()
where lower(slug) = 'bbq'
  and image_url is null;

update public.categories
set image_url = '/images/home/celjoe-home-categories-banner.jpg',
    updated_at = now()
where lower(slug) = 'drinks'
  and image_url is null;

update public.categories
set image_url = '/images/global/celjoe-global-cat-placeholder.jpg',
    updated_at = now()
where lower(slug) = 'bakery'
  and image_url is null;

update public.categories
set image_url = '/images/home/celjoe-home-catering-preview.jpg',
    updated_at = now()
where lower(slug) = 'catering'
  and image_url is null;

commit;
