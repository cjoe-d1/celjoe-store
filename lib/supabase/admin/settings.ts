import { db } from "lib/supabase/admin";

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export type SettingRow = {
  key: string;
  value: unknown;
  updatedAt: string;
  updatedBy: string | null;
};

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const { data, error } = await db
      .from("settings")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error.code)) return null;
      throw error;
    }
    if (!data) return null;
    return (data as { value: T }).value;
  } catch {
    return null;
  }
}

export async function listSettings(): Promise<SettingRow[]> {
  try {
    const { data, error } = await db
      .from("settings")
      .select("*")
      .order("key", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? [])
      // SECURITY: Filter out API key entries — keys must be env vars only
      .filter((d: Record<string, unknown>) => !String(d.key).startsWith("api_key:"))
      .map((d: Record<string, unknown>) => {
        const row = {
          key: String(d.key),
          value: d.value,
          updatedAt: String(d.updated_at ?? new Date().toISOString()),
          updatedBy: (d.updated_by as string | null) ?? null,
        };

        // SECURITY: Strip any remaining paystackSecretKey from existing payments settings
        if (row.key === "payments" && typeof row.value === "object" && row.value !== null) {
          const sanitized = { ...(row.value as Record<string, unknown>) };
          delete sanitized.paystackSecretKey;
          row.value = sanitized;
        }

        return row;
      });
  } catch {
    return [];
  }
}

export type CustomerDetail = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  loyaltyTier: string;
  isVip: boolean;
  isBlacklisted: boolean;
  marketingConsent: boolean;
  tags: string[];
  diet: string[];
  allergens: string[];
  internalNotes: string | null;
  ordersCount: number;
  totalSpend: number;
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string | null;
    isDefault: boolean;
  }>;
  createdAt: string;
};

export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  try {
    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    const d = data as Record<string, unknown>;

    const { data: addresses } = await db
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", id)
      .order("is_default", { ascending: false });

    return {
      id: String(d.id),
      email: String(d.email ?? ""),
      fullName: String(d.full_name ?? d.email ?? "Guest"),
      phone: (d.phone as string | null) ?? null,
      loyaltyTier: String(d.loyalty_tier ?? "regular"),
      isVip: Boolean(d.is_vip ?? false),
      isBlacklisted: Boolean(d.is_blacklisted ?? false),
      marketingConsent: Boolean(d.marketing_consent ?? false),
      tags: (d.tags as string[]) ?? [],
      diet: (d.diet as string[]) ?? [],
      allergens: (d.allergens as string[]) ?? [],
      internalNotes: (d.internal_notes as string | null) ?? null,
      ordersCount: Number(d.orders_count ?? 0),
      totalSpend: Number(d.total_spend ?? 0),
      addresses: (addresses ?? []).map((a: Record<string, unknown>) => ({
        id: String(a.id),
        label: String(a.label ?? "Home"),
        line1: String(a.line1 ?? ""),
        line2: (a.line2 as string | null) ?? null,
        city: String(a.city ?? ""),
        state: String(a.state ?? ""),
        postalCode: (a.postal_code as string | null) ?? null,
        isDefault: Boolean(a.is_default ?? false),
      })),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export async function getCustomerOrders(customerId: string): Promise<Array<{ id: string; orderNumber: string; status: string; total: number; createdAt: string }>> {
  try {
    const { data, error } = await db
      .from("orders")
      .select("id, order_number, order_status, total, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      orderNumber: String(d.order_number ?? ""),
      status: String(d.order_status ?? "pending"),
      total: Number(d.total ?? 0),
      createdAt: String(d.created_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
