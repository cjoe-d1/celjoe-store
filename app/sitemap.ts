import { getPages } from "lib/supabase/pages";
import { supabase } from "lib/supabase/client";
import { baseUrl } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routesMap = [""].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const categoriesPromise = supabase
    .from("categories")
    .select("slug,updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;
      return (data ?? []).map((category: any) => ({
        url: `${baseUrl}/search/${category.slug}`,
        lastModified: category.updated_at,
      }));
    });

  const productsPromise = supabase
    .from("products")
    .select("slug,updated_at")
    .eq("is_available", true)
    .order("updated_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;
      return (data ?? []).map((product: any) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updated_at,
      }));
    });

  const pagesPromise = getPages().then((pages) =>
    pages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
    })),
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (
      await Promise.all([categoriesPromise, productsPromise, pagesPromise])
    ).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...routesMap, ...fetchedRoutes];
}
