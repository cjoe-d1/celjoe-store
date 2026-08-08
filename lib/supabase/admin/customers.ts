import { db } from "lib/supabase/admin";

export type AdminCustomer = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpend: { amount: string; currencyCode: string };
  loyaltyTier: "guest" | "regular" | "devoted" | "ambassador";
  isVip: boolean;
  isBlacklisted: boolean;
  marketingConsent: boolean;
  tags: string[];
  preferences: {
    diet: string[];
    allergens: string[];
  };
};

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export async function listAdminCustomers(
  params: { search?: string } = {},
): Promise<{ customers: AdminCustomer[] }> {
  try {
    let query = db
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const search = params.search?.trim();
    if (search) {
      const escaped = search.replace(/[%_]/g, (m) => `\\${m}`);
      const like = `%${escaped}%`;
      query = query.or(`full_name.ilike.${like},email.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error.code)) return { customers: [] };
      throw error;
    }
    const customers = (data ?? []).map((c: Record<string, unknown>) => {
      const ordersCount = (c.orders_count as number | undefined) ?? 0;
      const totalAmount = (c.total_spend as string | undefined) ?? "0.00";
      let tier: AdminCustomer["loyaltyTier"] = "guest";
      if (ordersCount >= 50) tier = "ambassador";
      else if (ordersCount >= 20) tier = "devoted";
      else if (ordersCount >= 5) tier = "regular";
      return {
        id: String(c.id),
        email: String(c.email ?? ""),
        fullName: String(c.full_name ?? c.email ?? "Guest"),
        phone: (c.phone as string | null) ?? null,
        createdAt: String(c.created_at ?? new Date().toISOString()),
        ordersCount,
        totalSpend: { amount: totalAmount, currencyCode: "NGN" },
        loyaltyTier: tier,
        isVip: Boolean(c.is_vip ?? false),
        isBlacklisted: Boolean(c.is_blacklisted ?? false),
        marketingConsent: Boolean(c.marketing_consent ?? false),
        tags: ((c.tags as string[] | undefined) ?? []),
        preferences: {
          diet: ((c.diet as string[] | undefined) ?? []),
          allergens: ((c.allergens as string[] | undefined) ?? []),
        },
      };
    });
    return { customers };
  } catch {
    return { customers: [] };
  }
}

export async function getAdminCustomerById(id: string): Promise<AdminCustomer | null> {
  try {
    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error.code)) return null;
      throw error;
    }
    if (!data) return null;
    const c = data as Record<string, unknown>;
    const ordersCount = (c.orders_count as number | undefined) ?? 0;
    return {
      id: String(c.id),
      email: String(c.email ?? ""),
      fullName: String(c.full_name ?? c.email ?? "Guest"),
      phone: (c.phone as string | null) ?? null,
      createdAt: String(c.created_at ?? new Date().toISOString()),
      ordersCount,
      totalSpend: {
        amount: (c.total_spend as string | undefined) ?? "0.00",
        currencyCode: "NGN",
      },
      loyaltyTier: ordersCount >= 20 ? "devoted" : ordersCount >= 5 ? "regular" : "guest",
      isVip: Boolean(c.is_vip ?? false),
      isBlacklisted: Boolean(c.is_blacklisted ?? false),
      marketingConsent: Boolean(c.marketing_consent ?? false),
      tags: ((c.tags as string[] | undefined) ?? []),
      preferences: {
        diet: ((c.diet as string[] | undefined) ?? []),
        allergens: ((c.allergens as string[] | undefined) ?? []),
      },
    };
  } catch {
    return null;
  }
}
