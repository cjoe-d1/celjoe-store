"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Phase E — Variants & Inventory.
 *
 * Variants are simple: name, price, stock_quantity, is_available.
 * The "Quantity = 0 -> Unavailable" rule from the Phase 11 blueprint is
 * enforced both client-side (the editor flips is_available off when stock
 * hits 0) and server-side (this action re-asserts it on every write).
 */

const sanitiseName = (raw: unknown): string =>
  String(raw ?? "").trim().slice(0, 80) || "Variant";

const sanitisePrice = (raw: unknown): number => {
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
};

const sanitiseStock = (raw: unknown): number => {
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.floor(n);
};

export async function createVariantAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const productId = String(formData.get("product_id") ?? "").trim();
    if (!productId) return { ok: false, error: "Product required." };

    const name = sanitiseName(formData.get("name"));
    const price = sanitisePrice(formData.get("price"));
    const stockQuantity = sanitiseStock(formData.get("stock_quantity"));
    const isAvailable = formData.get("is_available") === "on" && stockQuantity > 0;

    // Find the next position value
    const { data: maxRow } = await db
      .from("product_variants")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = ((maxRow as { position?: number } | null)?.position ?? -1) + 1;

    const { data, error } = await db
      .from("product_variants")
      .insert({
        product_id: productId,
        name,
        price,
        stock_quantity: stockQuantity,
        is_available: isAvailable,
        position: nextPosition,
        option_values: [],
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        "product.variant.create",
        "product_variants",
        data?.id ?? null,
        { productId, name, price, stockQuantity },
        ip,
        userAgent,
      ),
    );

    revalidatePath(`/admin/products/${productId}`);
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create variant." };
  }
}

export async function updateVariantAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { ok: false, error: "Variant id required." };

    const productId = String(formData.get("product_id") ?? "").trim();
    const name = sanitiseName(formData.get("name"));
    const price = sanitisePrice(formData.get("price"));
    const stockQuantity = sanitiseStock(formData.get("stock_quantity"));
    const submittedAvailable = formData.get("is_available") === "on";
    // Blueprint rule: Quantity = 0  ->  Unavailable
    const isAvailable = submittedAvailable && stockQuantity > 0;

    const { error } = await db
      .from("product_variants")
      .update({
        name,
        price,
        stock_quantity: stockQuantity,
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        "product.variant.update",
        "product_variants",
        id,
        { productId, name, price, stockQuantity, isAvailable },
        ip,
        userAgent,
      ),
    );

    if (productId) revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update variant." };
  }
}

export async function deleteVariantAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { ok: false, error: "Variant id required." };
    const productId = String(formData.get("product_id") ?? "").trim();

    const { error } = await db.from("product_variants").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(
        session,
        "product.variant.delete",
        "product_variants",
        id,
        { productId },
        ip,
        userAgent,
      ),
    );

    if (productId) revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete variant." };
  }
}
