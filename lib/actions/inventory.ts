"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function receiveStockAction(
  ingredientId: string,
  quantity: number,
  unitCost: number,
  supplierId: string | null,
  note: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (quantity <= 0) return { ok: false, error: "Quantity must be positive." };

    const { data: ingredient, error: fetchError } = await db.from("ingredients")
      .select("stock")
      .eq("id", ingredientId)
      .single();

    if (fetchError) return { ok: false, error: fetchError.message };

    const newStock = Number(ingredient?.stock ?? 0) + quantity;

    const { error: updateError } = await db.from("ingredients")
      .update({ stock: newStock })
      .eq("id", ingredientId);

    if (updateError) return { ok: false, error: updateError.message };

    await db.from("stock_movements").insert({
      ingredient_id: ingredientId,
      movement_type: "receive",
      quantity,
      unit_cost: unitCost,
      supplier_id: supplierId,
      note,
      created_by: session.userId,
    });

    await logAudit(
      auditFromSession(session, "inventory.receive", "ingredients", ingredientId, {
        quantity, unitCost, supplierId, note,
      }, ip, userAgent),
    );

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to receive stock." };
  }
}

export async function adjustStockAction(
  ingredientId: string,
  newStock: number,
  reason: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (newStock < 0) return { ok: false, error: "Stock cannot be negative." };

    const { data: ingredient, error: fetchError } = await db.from("ingredients")
      .select("stock")
      .eq("id", ingredientId)
      .single();

    if (fetchError) return { ok: false, error: fetchError.message };

    const delta = newStock - Number(ingredient?.stock ?? 0);

    const { error: updateError } = await db.from("ingredients")
      .update({ stock: newStock })
      .eq("id", ingredientId);

    if (updateError) return { ok: false, error: updateError.message };

    await db.from("stock_movements").insert({
      ingredient_id: ingredientId,
      movement_type: "adjust",
      quantity: delta,
      note: reason,
      created_by: session.userId,
    });

    await logAudit(
      auditFromSession(session, "inventory.adjust", "ingredients", ingredientId, {
        newStock, delta, reason,
      }, ip, userAgent),
    );

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to adjust stock." };
  }
}

export async function recordWasteAction(
  ingredientId: string,
  quantity: number,
  reason: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (quantity <= 0) return { ok: false, error: "Quantity must be positive." };

    const { data: ingredient, error: fetchError } = await db.from("ingredients")
      .select("stock")
      .eq("id", ingredientId)
      .single();

    if (fetchError) return { ok: false, error: fetchError.message };

    const newStock = Math.max(0, Number(ingredient?.stock ?? 0) - quantity);

    const { error: updateError } = await db.from("ingredients")
      .update({ stock: newStock })
      .eq("id", ingredientId);

    if (updateError) return { ok: false, error: updateError.message };

    await db.from("stock_movements").insert({
      ingredient_id: ingredientId,
      movement_type: "waste",
      quantity: -quantity,
      note: reason,
      created_by: session.userId,
    });

    await logAudit(
      auditFromSession(session, "inventory.waste", "ingredients", ingredientId, {
        quantity, reason,
      }, ip, userAgent),
    );

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to record waste." };
  }
}

export async function createIngredientAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Ingredient name required." };

    const { data, error } = await db.from("ingredients")
      .insert({
        name,
        unit: String(formData.get("unit") ?? "unit"),
        stock: Number(formData.get("stock") ?? 0),
        low_stock_threshold: Number(formData.get("low_stock_threshold") ?? 0),
        supplier: String(formData.get("supplier") ?? "") || null,
        cost_per_unit: Number(formData.get("cost_per_unit") ?? 0),
        expiry: String(formData.get("expiry") ?? "") || null,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    const newId = (data as { id?: string } | null)?.id ?? null;

    await logAudit(
      auditFromSession(session, "inventory.create_ingredient", "ingredients", newId, {
        name,
      }, ip, userAgent),
    );

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create ingredient." };
  }
}

export async function updateIngredientAction(
  ingredientId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Ingredient name required." };

    const { error } = await db.from("ingredients")
      .update({
        name,
        unit: String(formData.get("unit") ?? "unit"),
        low_stock_threshold: Number(formData.get("low_stock_threshold") ?? 0),
        supplier: String(formData.get("supplier") ?? "") || null,
        cost_per_unit: Number(formData.get("cost_per_unit") ?? 0),
        expiry: String(formData.get("expiry") ?? "") || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ingredientId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "inventory.update_ingredient", "ingredients", ingredientId, {
        name,
      }, ip, userAgent),
    );

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${ingredientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update ingredient." };
  }
}

export async function createSupplierAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Supplier name required." };

    const { data, error } = await db.from("suppliers")
      .insert({
        name,
        contact: String(formData.get("contact") ?? "") || null,
        email: String(formData.get("email") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        address: String(formData.get("address") ?? "") || null,
        active: true,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    const newId = (data as { id?: string } | null)?.id ?? null;

    await logAudit(
      auditFromSession(session, "inventory.create_supplier", "suppliers", newId, {
        name,
      }, ip, userAgent),
    );

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create supplier." };
  }
}
