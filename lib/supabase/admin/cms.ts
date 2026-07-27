import { supabase } from "lib/supabase/client";

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export const CMS_SURFACES = [
  "homepage",
  "kitchen",
  "smokehouse",
  "catering",
  "our-story",
] as const;
export type CmsSurface = (typeof CMS_SURFACES)[number];
export const isCmsSurface = (s: string): s is CmsSurface =>
  (CMS_SURFACES as readonly string[]).includes(s);

export type CmsSurfaceRow = {
  surface: string;
  title: string;
  subtitle: string;
  body: string;
  heroImageUrl: string | null;
  visibility: "draft" | "published";
  scheduledFor: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sections: Array<{ id: string; type: string; data: unknown; position: number }>;
  version: number;
  publishedAt: string | null;
  updatedAt: string;
};

const rowToSurface = (d: Record<string, unknown>): CmsSurfaceRow => ({
  surface: String(d.surface),
  title: String(d.title ?? ""),
  subtitle: String(d.subtitle ?? ""),
  body: String(d.body ?? ""),
  heroImageUrl: (d.hero_image_url as string | null) ?? null,
  visibility: (d.visibility as "draft" | "published") ?? "draft",
  scheduledFor: (d.scheduled_for as string | null) ?? null,
  seoTitle: (d.seo_title as string | null) ?? null,
  seoDescription: (d.seo_description as string | null) ?? null,
  sections: (d.sections as CmsSurfaceRow["sections"]) ?? [],
  version: Number(d.version ?? 1),
  publishedAt: (d.published_at as string | null) ?? null,
  updatedAt: String(d.updated_at ?? new Date().toISOString()),
});

export async function getCmsSurface(surface: string): Promise<CmsSurfaceRow | null> {
  try {
    const { data, error } = await supabase
      .from("cms_surfaces")
      .select("*")
      .eq("surface", surface)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error.code)) return null;
      throw error;
    }
    if (!data) return null;
    return rowToSurface(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getCmsVersions(surface: string): Promise<Array<{ version: number; createdAt: string; payload: unknown }>> {
  try {
    const { data, error } = await supabase
      .from("cms_versions")
      .select("version, payload, archived_at")
      .eq("surface", surface)
      .order("version", { ascending: false })
      .limit(20);
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      version: Number(d.version),
      createdAt: String(d.archived_at ?? new Date().toISOString()),
      payload: d.payload,
    }));
  } catch {
    return [];
  }
}

export type TestimonialRow = {
  id: string;
  authorName: string;
  authorRole: string | null;
  body: string;
  rating: number;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

export async function listTestimonials(): Promise<TestimonialRow[]> {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      authorName: String(d.author_name ?? "Guest"),
      authorRole: (d.author_role as string | null) ?? null,
      body: String(d.body ?? ""),
      rating: Number(d.rating ?? 5),
      imageUrl: (d.image_url as string | null) ?? null,
      isPublished: Boolean(d.is_published ?? false),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function getTestimonial(id: string): Promise<TestimonialRow | null> {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
      id: String(d.id),
      authorName: String(d.author_name ?? "Guest"),
      authorRole: (d.author_role as string | null) ?? null,
      body: String(d.body ?? ""),
      rating: Number(d.rating ?? 5),
      imageUrl: (d.image_url as string | null) ?? null,
      isPublished: Boolean(d.is_published ?? false),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export type NavigationRow = {
  location: "header" | "footer";
  items: Array<{ label: string; href: string; position: number }>;
  updatedAt: string;
};

export async function getNavigation(location: "header" | "footer"): Promise<NavigationRow | null> {
  try {
    const { data, error } = await supabase
      .from("navigation")
      .select("*")
      .eq("location", location)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error.code)) return null;
      throw error;
    }
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
      location: (d.location as "header" | "footer") ?? "header",
      items: (d.items as NavigationRow["items"]) ?? [],
      updatedAt: String(d.updated_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export type PromotionRow = {
  id: string;
  title: string;
  body: string;
  code: string | null;
  discountType: string;
  discountValue: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export async function listPromotions(): Promise<PromotionRow[]> {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      title: String(d.title ?? ""),
      body: String(d.body ?? ""),
      code: (d.code as string | null) ?? null,
      discountType: String(d.discount_type ?? "percentage"),
      discountValue: Number(d.discount_value ?? 0),
      startsAt: (d.starts_at as string | null) ?? null,
      endsAt: (d.ends_at as string | null) ?? null,
      isActive: Boolean(d.is_active ?? false),
    }));
  } catch {
    return [];
  }
}

export type CmsPageRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  createdAt: string;
};

export async function listCmsPages(): Promise<CmsPageRow[]> {
  try {
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      slug: String(d.slug ?? ""),
      title: String(d.title ?? ""),
      body: String(d.body ?? ""),
      seoTitle: (d.seo_title as string | null) ?? null,
      seoDescription: (d.seo_description as string | null) ?? null,
      isPublished: Boolean(d.is_published ?? false),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function getCmsPage(slug: string): Promise<CmsPageRow | null> {
  try {
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
      id: String(d.id),
      slug: String(d.slug ?? ""),
      title: String(d.title ?? ""),
      body: String(d.body ?? ""),
      seoTitle: (d.seo_title as string | null) ?? null,
      seoDescription: (d.seo_description as string | null) ?? null,
      isPublished: Boolean(d.is_published ?? false),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export async function getCmsPageById(id: string): Promise<CmsPageRow | null> {
  try {
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
      id: String(d.id),
      slug: String(d.slug ?? ""),
      title: String(d.title ?? ""),
      body: String(d.body ?? ""),
      seoTitle: (d.seo_title as string | null) ?? null,
      seoDescription: (d.seo_description as string | null) ?? null,
      isPublished: Boolean(d.is_published ?? false),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}
