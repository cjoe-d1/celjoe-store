import { getPages } from "lib/supabase/pages";
import { supabase } from "lib/supabase/client";
import { baseUrl } from "lib/utils";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

/** Static pages always included in the sitemap. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: string }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/kitchen", priority: 0.9, changeFrequency: "daily" },
  { path: "/bbq", priority: 0.9, changeFrequency: "daily" },
  { path: "/catering", priority: 0.9, changeFrequency: "weekly" },
  { path: "/our-story", priority: 0.7, changeFrequency: "monthly" },
  { path: "/search", priority: 0.6, changeFrequency: "daily" },
  { path: "/track-order", priority: 0.5, changeFrequency: "weekly" },
];

async function fetchCategories(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("slug,updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) return [];
    return (data ?? []).map((category: { slug: string; updated_at: string }) => ({
      url: `${baseUrl}/search/${category.slug}`,
      lastModified: category.updated_at ?? new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function fetchProducts(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("slug,updated_at")
      .eq("is_available", true)
      .order("updated_at", { ascending: false });

    if (error) return [];
    return (data ?? []).map((product: { slug: string; updated_at: string }) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updated_at ?? new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

async function fetchPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const pages = await getPages();
    return pages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency as "daily" | "weekly" | "monthly",
    priority: r.priority,
  }));

  const [categories, products, pages] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
    fetchPages(),
  ]);

  return [...staticRoutes, ...categories, ...products, ...pages];
}
