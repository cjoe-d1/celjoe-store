import { supabaseAdmin } from "lib/supabase/admin";

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export async function listAdminProductVariants(
  productId: string,
): Promise<ProductVariant[]> {
  if (!productId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from("product_variants")
      .select(
        "id, product_id, name, price, stock_quantity, is_available, position, created_at, updated_at",
      )
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      return [];
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      productId: String(d.product_id),
      name: String(d.name ?? "Default"),
      price: Number(d.price ?? 0),
      stockQuantity: Number(d.stock_quantity ?? 0),
      isAvailable: Boolean(d.is_available ?? true),
      position: Number(d.position ?? 0),
      createdAt: String(d.created_at ?? new Date().toISOString()),
      updatedAt: String(d.updated_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
