"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const fullName = String(formData.get("full_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const loyaltyTier = String(formData.get("loyalty_tier") ?? "regular");
    const isVip = formData.get("is_vip") === "on";
    const isBlacklisted = formData.get("is_blacklisted") === "on";
    const marketingConsent = formData.get("marketing_consent") === "on";
    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const diet = String(formData.get("diet") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const allergens = String(formData.get("allergens") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const internalNotes = String(formData.get("internal_notes") ?? "").trim() || null;

    const { error } = await db.from("customers")
      .update({
        full_name: fullName,
        phone,
        loyalty_tier: loyaltyTier,
        is_vip: isVip,
        is_blacklisted: isBlacklisted,
        marketing_consent: marketingConsent,
        tags,
        diet,
        allergens,
        internal_notes: internalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "customer.update", "customers", customerId, {
        fullName, loyaltyTier, isVip, isBlacklisted,
      }, ip, userAgent),
    );

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update customer." };
  }
}

export async function addCustomerAddressAction(
  customerId: string,
  input: {
    label: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    isDefault: boolean;
  },
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("customer_addresses")
      .insert({
        customer_id: customerId,
        label: input.label || "Home",
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        is_default: input.isDefault,
      });

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "customer.add_address", "customers", customerId, input, ip, userAgent),
    );

    revalidatePath(`/admin/customers/${customerId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to add address." };
  }
}

export async function blacklistCustomerAction(
  customerId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("customers")
      .update({ is_blacklisted: true, internal_notes: reason, updated_at: new Date().toISOString() })
      .eq("id", customerId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "customer.blacklist", "customers", customerId, { reason }, ip, userAgent),
    );

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to blacklist customer." };
  }
}

export async function mergeCustomersAction(
  sourceId: string,
  targetId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (sourceId === targetId) return { ok: false, error: "Cannot merge a customer with itself." };

    await db.from("orders")
      .update({ customer_id: targetId })
      .eq("customer_id", sourceId);

    await db.from("customer_addresses")
      .update({ customer_id: targetId })
      .eq("customer_id", sourceId);

    const { error } = await db.from("customers")
      .delete()
      .eq("id", sourceId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "customer.merge", "customers", targetId, {
        sourceId, targetId,
      }, ip, userAgent),
    );

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${targetId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to merge customers." };
  }
}
