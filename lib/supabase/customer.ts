import { requireCustomerSession, getSupabaseServerClient } from "lib/auth/session";
import type { OrderStatus } from "lib/supabase/orders";
import { db } from "lib/supabase/admin";

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  trackingToken: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  itemCount: number;
};

export type CustomerAddress = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  instructions: string | null;
  isDefault: boolean;
  createdAt: string;
};

/**
 * Resolves the authenticated Supabase user to a `customers.id`.
 *
 * Identity chain:  auth.users.id → customers.auth_user_id → customers.id
 *
 * Resolution strategy:
 *   1. Primary (RLS-enforced): look up by auth_user_id via the SSR client.
 *      The JWT sub claim must match auth_user_id — RLS enforces this.
 *   2. Legacy reconciliation (service role): if no match by auth_user_id,
 *      look up by email. This handles pre-existing customer records created
 *      before the auth_user_id column was added (migration 0009). The
 *      auth_user_id is updated so subsequent lookups use the fast path.
 *   3. Create (service role): if no customer record exists, insert one
 *      linked to the authenticated user.
 *
 * Email is never used as the primary identity key — auth_user_id is the
 * authoritative link between auth.users and customers.
 */
export const getOrCreateCustomerId = async (
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  email: string,
  fullName: string | null,
): Promise<string | null> => {
  // 1. Primary — find by auth_user_id (RLS-enforced, fast path).
  const { data: existing, error: lookupErr } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (lookupErr) {
    console.error("[getOrCreateCustomerId] auth_user_id lookup failed:", lookupErr.message);
  }
  if (existing && "id" in existing && existing.id) return existing.id as string;

  // 2. Legacy reconciliation — service-role lookup by email.
  //    Only needed for customer records that exist without a linked
  //    auth_user_id (created before migration 0009, or by guest checkout).
  try {
    const { data: legacy } = await db
      .from("customers")
      .select("id, auth_user_id")
      .eq("email", email)
      .maybeSingle();

    if (legacy && "id" in legacy && legacy.id) {
      // If the legacy record has a different auth_user_id, do NOT
      // overwrite it — that would steal another user's customer record.
      if (legacy.auth_user_id && legacy.auth_user_id !== userId) {
        console.error(
          `[getOrCreateCustomerId] email ${email} is already linked to a different auth user. ` +
          `Requested userId=${userId}, existing auth_user_id=${legacy.auth_user_id}. ` +
          `Skipping reconciliation to prevent identity theft.`,
        );
        return null;
      }
      // Safe to link: auth_user_id is null or already matches.
      await db
        .from("customers")
        .update({ auth_user_id: userId })
        .eq("id", legacy.id);
      return legacy.id as string;
    }
  } catch (err) {
    console.error("[getOrCreateCustomerId] legacy email lookup failed:", err);
  }

  // 3. Create — insert a new customer record via service role.
  try {
    const { data: inserted, error: insertErr } = await db
      .from("customers")
      .insert({
        email,
        full_name: fullName ?? null,
        auth_user_id: userId,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[getOrCreateCustomerId] insert failed:", insertErr.message, insertErr.details);
      return null;
    }
    if (inserted && "id" in inserted && inserted.id) {
      return inserted.id as string;
    }
  } catch (err) {
    console.error("[getOrCreateCustomerId] insert error:", err);
  }

  console.error(
    `[getOrCreateCustomerId] all resolution paths failed for userId=${userId}, email=${email}`,
  );
  return null;
};

export async function listCustomerOrders(): Promise<CustomerOrderSummary[]> {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return [];
  }
  const supabase = await getSupabaseServerClient();
  const customerId = await getOrCreateCustomerId(
    supabase,
    session.userId,
    session.email,
    session.fullName,
  );
  if (!customerId) return [];

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, tracking_token, order_status, total, created_at, order_items(id)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return (orders ?? []).map((o) => ({
    id: o.id as string,
    orderNumber: (o.order_number as string) ?? (o.id as string).slice(0, 8),
    trackingToken: (o.tracking_token as string) ?? "",
    status: (o.order_status as OrderStatus) ?? "pending",
    total: Number(o.total ?? 0),
    createdAt: o.created_at as string,
    itemCount: Array.isArray(o.order_items) ? o.order_items.length : 0,
  }));
}

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return [];
  }
  const supabase = await getSupabaseServerClient();
  const customerId = await getOrCreateCustomerId(
    supabase,
    session.userId,
    session.email,
    session.fullName,
  );
  if (!customerId) return [];

  const { data, error } = await supabase
    .from("customer_addresses")
    .select(
      "id, label, line1, line2, city, state, postal_code, instructions, is_default, created_at",
    )
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((a) => ({
    id: a.id as string,
    label: (a.label as string | null) ?? null,
    line1: (a.line1 as string) ?? "",
    line2: (a.line2 as string | null) ?? null,
    city: (a.city as string) ?? "",
    state: (a.state as string) ?? "",
    postalCode: (a.postal_code as string | null) ?? null,
    instructions: (a.instructions as string | null) ?? null,
    isDefault: Boolean(a.is_default),
    createdAt: a.created_at as string,
  }));
}

export type CreateCustomerAddressInput = Omit<
  CustomerAddress,
  "id" | "createdAt" | "isDefault"
>;

export async function createCustomerAddress(
  input: CreateCustomerAddressInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await getSupabaseServerClient();
  const customerId = await getOrCreateCustomerId(
    supabase,
    session.userId,
    session.email,
    session.fullName,
  );
  if (!customerId) {
    return { ok: false, error: "Could not resolve your customer record." };
  }

  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: customerId,
      label: input.label,
      line1: input.line1,
      line2: input.line2,
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      instructions: input.instructions,
      is_default: false,
    })
    .select("id")
    .single();
  if (error || !data || !("id" in data) || !data.id) {
    return { ok: false, error: error?.message ?? "Could not save address." };
  }
  return { ok: true, id: data.id as string };
}

export async function deleteCustomerAddress(
  addressId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await getSupabaseServerClient();
  const customerId = await getOrCreateCustomerId(
    supabase,
    session.userId,
    session.email,
    session.fullName,
  );
  if (!customerId) {
    return { ok: false, error: "Could not resolve your customer record." };
  }
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type UpdateCustomerAddressInput = Partial<
  Omit<CustomerAddress, "id" | "createdAt">
> & { id: string };

export async function updateCustomerAddress(
  input: UpdateCustomerAddressInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await getSupabaseServerClient();
  const customerId = await getOrCreateCustomerId(
    supabase,
    session.userId,
    session.email,
    session.fullName,
  );
  if (!customerId) {
    return { ok: false, error: "Could not resolve your customer record." };
  }

  // Build the update payload — only include fields that were provided.
  const payload: Record<string, unknown> = {};
  if (input.label !== undefined) payload.label = input.label;
  if (input.line1 !== undefined) payload.line1 = input.line1;
  if (input.line2 !== undefined) payload.line2 = input.line2;
  if (input.city !== undefined) payload.city = input.city;
  if (input.state !== undefined) payload.state = input.state;
  if (input.postalCode !== undefined) payload.postal_code = input.postalCode;
  if (input.instructions !== undefined) payload.instructions = input.instructions;
  if (input.isDefault !== undefined) payload.is_default = input.isDefault;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("customer_addresses")
    .update(payload)
    .eq("id", input.id)
    .eq("customer_id", customerId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
