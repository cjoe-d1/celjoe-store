import { supabase } from "lib/supabase/client";

export type SitePage = {
  id: string;
  title: string;
  slug: string;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

const stripHtmlToText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
};

const toSitePage = (row: any): SitePage => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  contentHtml: row.content_html,
  seoTitle: row.seo_title,
  seoDescription: row.seo_description,
  published: row.published,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getPageBySlug = async (slug: string): Promise<SitePage | null> => {
  const { data, error } = await supabase
    .from("site_pages")
    .select(
      "id,title,slug,content_html,seo_title,seo_description,published,created_at,updated_at",
    )
    .eq("slug", slug)
    .eq("published", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toSitePage(data);
};

export const getPages = async (): Promise<Pick<SitePage, "slug" | "updatedAt">[]> => {
  const { data, error } = await supabase
    .from("site_pages")
    .select("slug,updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    slug: row.slug as string,
    updatedAt: row.updated_at as string,
  }));
};

export const getPageMeta = (page: SitePage) => {
  const title = page.seoTitle || page.title;
  const description =
    page.seoDescription ||
    truncate(stripHtmlToText(page.contentHtml), 160);

  return { title, description };
};
