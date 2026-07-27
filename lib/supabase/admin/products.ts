import { db } from "lib/supabase/admin";

// ── Types ──────────────────────────────────────────────────────────
// Mirrors the live database columns exactly (audit 2026-07-26).
// Columns on disk but not in the Phase 11 blueprint (image_url,
// preparation_time_minutes, stock_quantity, low_stock_threshold,
// search_vector) are intentionally omitted from the admin types
// because the frontend never reads or writes them.

export type ProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  preparation_minutes: number;
  tags: string[];
  discount_price: number | null;
  status: string;
  is_archived: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  /** Populated when joining with categories via category_id */
  primary_category?: { id: string; name: string; slug: string } | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
};

export type ProductWithCategories = ProductRow & {
  categories: { id: string; name: string; slug: string }[];
};

// ── Data access ───────────────────────────────────────────────────
// Uses `db` (service-role client) so queries bypass RLS.

export async function getProducts(): Promise<ProductRow[]> {
  const { data, error } = await db
    .from("products")
    .select(
      "id,category_id,name,slug,description,short_description,price,is_available,is_featured,preparation_minutes,tags,discount_price,status,is_archived,seo_title,seo_description,created_at,updated_at,primary_category:categories!products_category_fk(id,name,slug)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

export async function getProductById(
  id: string
): Promise<ProductWithCategories | null> {
  const [productRes, pcRes] = await Promise.all([
    db
      .from("products")
      .select(
        "id,category_id,name,slug,description,short_description,price,is_available,is_featured,preparation_minutes,tags,discount_price,status,is_archived,seo_title,seo_description,created_at,updated_at"
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("product_categories")
      .select("category_id, categories(id, name, slug)")
      .eq("product_id", id),
  ]);

  if (productRes.error) throw new Error(productRes.error.message);
  if (!productRes.data) return null;

  const product = productRes.data as ProductRow;
  const cats = ((pcRes.data ?? []) as Array<{
    category_id: string;
    categories: { id: string; name: string; slug: string } | null;
  }>)
    .filter((r) => r.categories)
    .map((r) => r.categories!);

  return { ...product, categories: cats };
}

export async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await db
    .from("categories")
    .select("id,name,slug,description,image_url,parent_id,display_order,is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}

export async function getProductCategoryIds(
  productId: string
): Promise<string[]> {
  const { data, error } = await db
    .from("product_categories")
    .select("category_id")
    .eq("product_id", productId);

  if (error) throw new Error(error.message);
  return ((data ?? []) as { category_id: string }[]).map(
    (r) => r.category_id
  );
}

export async function setProductCategories(
  productId: string,
  categoryIds: string[]
): Promise<void> {
  // Delete existing mappings
  await db
    .from("product_categories")
    .delete()
    .eq("product_id", productId);

  if (categoryIds.length === 0) return;

  // Insert new mappings
  const rows = categoryIds.map((cid) => ({
    product_id: productId,
    category_id: cid,
  }));

  const { error } = await db.from("product_categories").insert(rows);
  if (error) throw new Error(error.message);
}

export async function productSlugExists(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let q = db.from("products").select("id").eq("slug", slug);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q.maybeSingle();
  if (error) return false;
  return Boolean(data);
}

// ── Legacy exports (used by inventory module — outside Phase A–D scope) ──
// These will be refactored when the inventory module is rebuilt.

export async function getIngredientById(id: string) {
  try {
    const { data, error } = await db
      .from("ingredients")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    const d = data as Record<string, unknown>;
    return {
      id: String(d.id),
      name: String(d.name ?? ""),
      unit: String(d.unit ?? "unit"),
      stock: Number(d.stock ?? 0),
      lowStockThreshold: Number(d.low_stock_threshold ?? 0),
      supplier: (d.supplier as string | null) ?? null,
      costPerUnit: Number(d.cost_per_unit ?? 0),
      expiry: (d.expiry as string | null) ?? null,
      updatedAt: String(d.updated_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export async function getStockMovements(
  ingredientId: string
): Promise<
  Array<{
    id: string;
    type: string;
    quantity: number;
    unitCost: number;
    note: string | null;
    createdAt: string;
    createdBy: string | null;
  }>
> {
  try {
    const { data, error } = await db
      .from("stock_movements")
      .select("*")
      .eq("ingredient_id", ingredientId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      type: String(d.movement_type ?? ""),
      quantity: Number(d.quantity ?? 0),
      unitCost: Number(d.unit_cost ?? 0),
      note: (d.note as string | null) ?? null,
      createdAt: String(d.created_at ?? new Date().toISOString()),
      createdBy: (d.created_by as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}
