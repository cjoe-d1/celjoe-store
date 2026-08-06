-- =========================================================================
-- Phase H Redesign — Remove generic surface CMS
-- =========================================================================
-- The section-based CMS (cms_surfaces / cms_versions) is being removed as
-- a deliberate product decision.  Page layouts are code-driven; only
-- business content (testimonials, promotions, navigation, pages) remains
-- editable via the CMS admin.
--
-- Tables retained: testimonials, promotions, navigation, cms_pages
-- Tables dropped:   cms_surfaces, cms_versions

-- Remove the public-read policy added in 0020
drop policy if exists "cms_surfaces_public_read" on public.cms_surfaces;

-- Drop version history first (depends on cms_surfaces conceptually)
drop table if exists public.cms_versions cascade;

-- Drop the surface table
drop table if exists public.cms_surfaces cascade;
