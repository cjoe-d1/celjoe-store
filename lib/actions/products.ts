"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
import {
  getProductById,
  getProducts,
  productSlugExists,
  setProductCategories,
} from "lib/supabase/admin/products";

// ── Helpers ───────────────────────────────────────────────────────

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `product-${Date.now()}`;

async function deriveUniqueSlug(
  base: string,
  excludeId?: string
): Promise<string> {
  const root = base ? slugify(base) : `product-${Date.now()}`;
  const exists = await productSlugExists(root, excludeId);
  if (!exists) return root;

  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    const taken = await productSlugExists(candidate, excludeId);
    if (!taken) return candidate;
  }
  return `${root}-${Date.now()}`;
}

function buildAutoSeo(params: {
  name: string;
  shortDescription: string | null;
  description: string | null;
}): { seoTitle: string; seoDescription: string } {
  const seoTitle = params.name.slice(0, 70);
  const source =
    (params.shortDescription ?? "").trim() ||
    (params.description ?? "").trim().slice(0, 160);
  const seoDescription = source.replace(/\s+/g, " ").slice(0, 160);
  return { seoTitle, seoDescription };
}

// ── Actions ───────────────────────────────────────────────────────

export async function createProductAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Product name is required." };

    const price = Number(formData.get("price") ?? "0");
    if (Number.isNaN(price) || price < 0)
      return { ok: false, error: "Invalid price." };

    // Parse selected categories from multi-value FormData
    const categoryIds = formData.getAll("category_ids").map((v) => String(v).trim()).filter(Boolean);
    if (categoryIds.length === 0)
      return { ok: false, error: "At least one category is required." };
    const categoryId = categoryIds[0]; // backward-compat: first selected → category_id
    const slugInput = String(formData.get("slug") ?? "").trim();
    const description =
      String(formData.get("description") ?? "").trim() || null;
    const shortDescription =
      String(formData.get("short_description") ?? "").trim() || null;
    const preparationMinutes = Number(
      formData.get("preparation_minutes") ?? 0
    );
    const isAvailable = formData.get("is_available") === "on";
    const isFeatured = formData.get("is_featured") === "on";
    const hasVariants = formData.get("has_variants") === "on";
    // For variant products, product price is irrelevant (each variant owns its price)
    const effectivePrice = hasVariants ? 0 : price;
    const discountRaw = String(formData.get("discount_price") ?? "");
    const discountPrice = discountRaw ? Number(discountRaw) : null;
    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const slug = await deriveUniqueSlug(slugInput || name);
    const { seoTitle, seoDescription } = buildAutoSeo({
      name,
      shortDescription,
      description,
    });

    const { data, error } = await db
      .from("products")
      .insert({
        name,
        slug,
        description,
        short_description: shortDescription,
        category_id: categoryId,
        price: effectivePrice,
        discount_price: discountPrice,
        preparation_minutes: preparationMinutes,
        is_available: isAvailable,
        is_featured: isFeatured,
        has_variants: hasVariants,
        tags,
        seo_title: seoTitle,
        seo_description: seoDescription,
        status: "draft",
        is_archived: false,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    // Insert category mappings
    await setProductCategories(data.id, categoryIds);

    // For simple products, auto-create a default variant so the cart system works
    if (!hasVariants) {
      await db.from("product_variants").insert({
        product_id: data.id,
        name: "Default",
        price: effectivePrice,
        stock_quantity: isAvailable ? 999 : 0,
        is_available: isAvailable,
        option_values: "[]",
        position: 0,
      });
    }

    await logAudit(
      auditFromSession(
        session,
        "product.create",
        "products",
        data?.id ?? null,
        { name, slug, price, categoryIds },
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    return { ok: true, id: data?.id };
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT"))
      throw err;
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create product.",
    };
  }
}

export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Product name is required." };

    const price = Number(formData.get("price") ?? "0");
    if (Number.isNaN(price) || price < 0)
      return { ok: false, error: "Invalid price." };

    // Parse selected categories from multi-value FormData
    const categoryIds = formData.getAll("category_ids").map((v) => String(v).trim()).filter(Boolean);
    if (categoryIds.length === 0)
      return { ok: false, error: "At least one category is required." };
    const categoryId = categoryIds[0]; // backward-compat: first selected → category_id
    const slugInput = String(formData.get("slug") ?? "").trim();
    const description =
      String(formData.get("description") ?? "").trim() || null;
    const shortDescription =
      String(formData.get("short_description") ?? "").trim() || null;
    const preparationMinutes = Number(
      formData.get("preparation_minutes") ?? 0
    );
    const isAvailable = formData.get("is_available") === "on";
    const isFeatured = formData.get("is_featured") === "on";
    const hasVariants = formData.get("has_variants") === "on";
    // For variant products, product price is irrelevant (each variant owns its price)
    const effectivePrice = hasVariants ? 0 : price;

    // Phase 8 — Reconcile variants when switching product type.
    // variant → simple: delete all variants, create one Default variant.
    // simple → variant: delete the auto-generated Default variant.
    {
      const { data: current } = await db
        .from("products")
        .select("has_variants")
        .eq("id", productId)
        .single();

      const wasVariant = current?.has_variants === true;
      const isSwitching = wasVariant !== hasVariants;

      if (isSwitching) {
        const { data: existingVariants } = await db
          .from("product_variants")
          .select("id,name")
          .eq("product_id", productId);

        if (hasVariants) {
          // Switching to variant mode: delete the Default variant.
          const defaultVariant = (existingVariants ?? []).find(
            (v: { id: string; name: string }) => v.name === "Default",
          );
          if (defaultVariant) {
            await db.from("product_variants").delete().eq("id", defaultVariant.id);
          }
        } else {
          // Switching to simple mode: delete all variants, recreate a single Default variant.
          const variantIds = (existingVariants ?? []).map((v: { id: string }) => v.id);
          if (variantIds.length > 0) {
            await db.from("product_variants").delete().in("id", variantIds);
          }
          await db.from("product_variants").insert({
            product_id: productId,
            name: "Default",
            price,
            stock_quantity: isAvailable ? 999 : 0,
            is_available: isAvailable,
            option_values: "[]",
            position: 0,
          });
        }
      }
    }

    const discountRaw = String(formData.get("discount_price") ?? "");
    const discountPrice = discountRaw ? Number(discountRaw) : null;
    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const slug = await deriveUniqueSlug(slugInput || name, productId);
    const { seoTitle, seoDescription } = buildAutoSeo({
      name,
      shortDescription,
      description,
    });

    const { error } = await db
      .from("products")
      .update({
        name,
        slug,
        description,
        short_description: shortDescription,
        category_id: categoryId,
        price: effectivePrice,
        discount_price: discountPrice,
        preparation_minutes: preparationMinutes,
        is_available: isAvailable,
        is_featured: isFeatured,
        has_variants: hasVariants,
        tags,
        seo_title: seoTitle,
        seo_description: seoDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) return { ok: false, error: error.message };

    // Replace category mappings
    await setProductCategories(productId, categoryIds);

    await logAudit(
      auditFromSession(
        session,
        "product.update",
        "products",
        productId,
        { name, slug, price, categoryIds },
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update product.",
    };
  }
}

export async function archiveProductAction(
  productId: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db
      .from("products")
      .update({
        is_archived: true,
        is_available: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        "product.archive",
        "products",
        productId,
        null,
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to archive product.",
    };
  }
}

export async function restoreProductAction(
  productId: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db
      .from("products")
      .update({
        is_archived: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        "product.restore",
        "products",
        productId,
        null,
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to restore product.",
    };
  }
}

export async function deleteProductAction(
  productId: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        "product.delete",
        "products",
        productId,
        null,
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete product.",
    };
  }
}

export async function duplicateProductAction(
  productId: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const original = await getProductById(productId);
    if (!original) return { ok: false, error: "Product not found." };

    const originalCategoryIds = original.categories.map((c) => c.id);
    const slug = await deriveUniqueSlug(`${original.slug}-copy`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _ca, updated_at: _ua, categories: _cats, ...rest } = original;

    const { data, error } = await db
      .from("products")
      .insert({
        ...rest,
        name: `${original.name} (Copy)`,
        slug,
        status: "draft",
        is_archived: false,
        is_available: false,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    // Copy category mappings to the duplicated product
    if (originalCategoryIds.length > 0) {
      await setProductCategories(data.id, originalCategoryIds);
    }

    await logAudit(
      auditFromSession(
        session,
        "product.duplicate",
        "products",
        data?.id ?? null,
        { sourceId: productId },
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    return { ok: true, id: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to duplicate product.",
    };
  }
}

export async function publishProductAction(
  productId: string
): Promise<ActionResult> {
  return setProductStatus(productId, "active", "product.publish");
}

export async function unpublishProductAction(
  productId: string
): Promise<ActionResult> {
  return setProductStatus(productId, "draft", "product.unpublish");
}

async function setProductStatus(
  productId: string,
  status: "active" | "draft",
  action: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        action,
        "products",
        productId,
        { status },
        ip,
        userAgent
      )
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    };
  }
}
