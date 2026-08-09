"use server";

import { redirect } from "next/navigation";
import { createCustomerAddress, deleteCustomerAddress } from "lib/supabase/customer";
import { getCurrentCustomerSession, getClientMetadata } from "lib/auth/session";
import { auditFromCustomerSession, logAudit } from "lib/auth/audit";

export async function createAddressAction(formData: FormData): Promise<void> {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/addresses");
  }
  const label = String(formData.get("label") ?? "").trim() || null;
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postal_code") ?? "").trim() || null;
  const instructions = String(formData.get("instructions") ?? "").trim() || null;

  if (!line1 || !city || !state) {
    redirect("/account/addresses?error=" + encodeURIComponent("Street, city, and state are required."));
  }

  const result = await createCustomerAddress({
    label,
    line1,
    line2,
    city,
    state,
    postalCode,
    instructions,
  });
  if (!result.ok) {
    redirect("/account/addresses?error=" + encodeURIComponent(result.error));
  }

  const { ip, userAgent } = await getClientMetadata();
  await logAudit(
    auditFromCustomerSession(
      session,
      "customer_address.create",
      "customer_addresses",
      result.id,
      { label, city },
      ip,
      userAgent,
    ),
  );

  redirect("/account/addresses?saved=1");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/addresses");
  }
  const id = String(formData.get("address_id") ?? "");
  if (!id) redirect("/account/addresses?error=" + encodeURIComponent("Missing address id."));
  const result = await deleteCustomerAddress(id);
  if (!result.ok) {
    redirect("/account/addresses?error=" + encodeURIComponent(result.error));
  }

  const { ip, userAgent } = await getClientMetadata();
  await logAudit(
    auditFromCustomerSession(
      session,
      "customer_address.delete",
      "customer_addresses",
      id,
      null,
      ip,
      userAgent,
    ),
  );

  redirect("/account/addresses");
}
