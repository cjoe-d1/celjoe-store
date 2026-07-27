import { supabase } from "lib/supabase/client";
import { supabaseAdmin } from "lib/supabase/admin";

export type ProductImage = {
  id: string;
  productId: string;
  imageUrl: string;
  path: string;
  altText: string | null;
  isHero: boolean;
  displayOrder: number;
  uploadedAt: string;
  uploadedBy: string | null;
};

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

/**
 * Public read of product images (for storefront / product detail page).
 * Uses the anon client — RLS is permissive for SELECT.
 */
export async function listProductImages(productId: string): Promise<ProductImage[]> {
  if (!productId) return [];
  try {
    const { data, error } = await supabase
      .from("product_images")
      .select("id, product_id, image_url, path, alt_text, is_hero, display_order, uploaded_at, uploaded_by")
      .eq("product_id", productId)
      .order("is_hero", { ascending: false })
      .order("display_order", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      productId: String(d.product_id),
      imageUrl: String(d.image_url ?? ""),
      path: String(d.path ?? d.image_url ?? ""),
      altText: (d.alt_text as string | null) ?? null,
      isHero: Boolean(d.is_hero),
      displayOrder: Number(d.display_order ?? 0),
      uploadedAt: String(d.uploaded_at ?? new Date().toISOString()),
      uploadedBy: (d.uploaded_by as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Admin read of product images. Identical to the public read for now
 * but uses the service-role client to bypass any future RLS tightening.
 */
export async function listAdminProductImages(productId: string): Promise<ProductImage[]> {
  if (!productId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from("product_images")
      .select("id, product_id, image_url, path, alt_text, is_hero, display_order, uploaded_at, uploaded_by")
      .eq("product_id", productId)
      .order("is_hero", { ascending: false })
      .order("display_order", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      productId: String(d.product_id),
      imageUrl: String(d.image_url ?? ""),
      path: String(d.path ?? d.image_url ?? ""),
      altText: (d.alt_text as string | null) ?? null,
      isHero: Boolean(d.is_hero),
      displayOrder: Number(d.display_order ?? 0),
      uploadedAt: String(d.uploaded_at ?? new Date().toISOString()),
      uploadedBy: (d.uploaded_by as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}
