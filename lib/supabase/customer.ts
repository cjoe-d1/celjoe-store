import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { requireEnv } from "config/env";
import { requireCustomerSession } from "lib/auth/session";
import type { OrderStatus } from "lib/supabase/orders";

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
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

const getSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv.supabaseUrl(),
    requireEnv.supabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore
          }
        },
      },
    },
  );
};

const getOrCreateCustomerId = async (
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  email: string,
  fullName: string | null,
): Promise<string | null> => {
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (existing && "id" in existing && existing.id) return existing.id as string;

  const { data: fallback } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (fallback && "id" in fallback && fallback.id) {
    await supabase
      .from("customers")
      .update({ auth_user_id: userId })
      .eq("id", fallback.id as string);
    return fallback.id as string;
  }

  const { data: inserted, error } = await supabase
    .from("customers")
    .insert({
      email,
      full_name: fullName ?? null,
      auth_user_id: userId,
    })
    .select("id")
    .single();
  if (error || !inserted || !("id" in inserted) || !inserted.id) return null;
  return inserted.id as string;
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
    .select("id, order_number, status, total, created_at, order_items(id)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return (orders ?? []).map((o) => ({
    id: o.id as string,
    orderNumber: (o.order_number as string) ?? (o.id as string).slice(0, 8),
    status: (o.status as OrderStatus) ?? "pending",
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
