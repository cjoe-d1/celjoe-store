import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Inline types & helpers (avoid transitive imports from lib/supabase/orders
// and lib/supabase/admin/orders — those pull lib/supabase/client, whose
// lazy Proxy triggers getRequiredAny() on the browser side).
// ---------------------------------------------------------------------------

type AnalyticsOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  customerName: string;
  customerEmail: string | null;
  total: number;
  createdAt: string;
};

function toNumber(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapRow(d: Record<string, unknown>): AnalyticsOrder {
  const rawStatus = (d.order_status ?? d.status ?? "pending") as string;
  return {
    id: String(d.id ?? ""),
    orderNumber: String(d.order_number ?? d.orderNumber ?? ""),
    orderStatus: rawStatus,
    customerName: String(d.customer_name ?? d.customerName ?? "Guest"),
    customerEmail: (d.customer_email ?? d.customerEmail ?? null) as string | null,
    total: toNumber(d.total),
    createdAt: String(d.created_at ?? d.createdAt ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Browser-compatible Supabase client (lazy singleton)
// ---------------------------------------------------------------------------

let _browserClient: SupabaseClient | undefined;

function getBrowserSupabase(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );
  }
  return _browserClient;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BestSeller = {
  productName: string;
  count: number;
};

export type ReportsAnalytics = {
  orders: AnalyticsOrder[];
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
  bestSellers: BestSeller[];
  returningCustomers: number;
};

export type TimeBoundMetrics = {
  todayRevenue: number;
  yesterdayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
};

// ---------------------------------------------------------------------------
// Date helpers — localised date → UTC ISO strings
// ---------------------------------------------------------------------------

/** Start of today (00:00:00.000 local) as UTC ISO string. */
function todayStartISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/** End of today (23:59:59.999 local) as UTC ISO string. */
function todayEndISO(): string {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
}

/** Start of yesterday (00:00:00.000 local) as UTC ISO string. */
function yesterdayStartISO(): string {
  const t = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return new Date(t.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

/** End of yesterday (23:59:59.999 local) as UTC ISO string. */
function yesterdayEndISO(): string {
  const t = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return new Date(t.getTime() - 1).toISOString();
}

function nowISO(): string {
  return new Date().toISOString();
}

function daysAgoISO(days: number): string {
  const t = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return new Date(t.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

function sumTotals(rows: { total?: number | string | null }[] | null): number {
  return (rows ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);
}

/**
 * Fetch full analytics for a given date range.  Queries orders and
 * order_items in parallel, then computes all Phase J metrics client-side.
 */
export async function fetchAnalytics(
  dateFrom: string,
  dateTo: string,
): Promise<ReportsAnalytics> {
  const client = getBrowserSupabase();
  const [ordersResult, itemsResult] = await Promise.all([
    client
      .from("orders")
      .select("*")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo)
      .order("created_at", { ascending: false }),
    // We fetch order_items for the same window so we can derive best-sellers.
    // Using a separate query avoids the need for a join / RPC when the order
    // count is reasonable (< 500 rows).
    client
      .from("order_items")
      .select("product_snapshot")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),
  ]);

  if (ordersResult.error) {
    const e = ordersResult.error as unknown as Record<string, unknown>;
    console.error("fetchAnalytics: orders query failed", {
      message: e.message ?? "(no message)",
      code: e.code ?? "(no code)",
      details: e.details ?? "(no details)",
      hint: e.hint ?? "(no hint)",
      raw: JSON.stringify(Object.getOwnPropertyNames(e)),
    });
    return emptyAnalytics();
  }

  const orders = (ordersResult.data ?? []).map((d) => mapRow(d as Record<string, unknown>));
  const totalRevenue = sumTotals(ordersResult.data);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Status breakdowns — all 6 order-lifecycle states
  const statusMap = new Map<string, number>();
  for (const o of orders) statusMap.set(o.orderStatus, (statusMap.get(o.orderStatus) ?? 0) + 1);
  const pending = statusMap.get("pending") ?? 0;
  const confirmed = statusMap.get("confirmed") ?? 0;
  const preparing = statusMap.get("preparing") ?? 0;
  const ready = statusMap.get("ready") ?? 0;
  const completed = statusMap.get("completed") ?? 0;
  const cancelled = statusMap.get("cancelled") ?? 0;

  // Best sellers — aggregate product_snapshot->>name from order_items
  const productCounts = new Map<string, number>();
  for (const item of (itemsResult.data ?? [])) {
    const snapshot = (item as { product_snapshot?: { name?: string } }).product_snapshot;
    const name = snapshot?.name?.trim();
    if (name) productCounts.set(name, (productCounts.get(name) ?? 0) + 1);
  }
  const bestSellers: BestSeller[] = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([productName, count]) => ({ productName, count }));

  // Returning customers — customers with > 1 order in the window
  const customerCounts = new Map<string, number>();
  for (const o of orders) {
    const key = o.customerEmail ?? o.customerName;
    if (key) customerCounts.set(key, (customerCounts.get(key) ?? 0) + 1);
  }
  const returningCustomers = [...customerCounts.values()].filter((c) => c > 1).length;

  return {
    orders,
    totalRevenue,
    totalOrders,
    aov,
    pending,
    confirmed,
    preparing,
    ready,
    completed,
    cancelled,
    bestSellers,
    returningCustomers,
  };
}

/**
 * Fetch the 4 time-bound KPI buckets (Today, Yesterday, Last 7 Days,
 * Last 30 Days) in a single parallel round-trip.
 */
export async function fetchTimeBoundMetrics(): Promise<TimeBoundMetrics> {
  const client = getBrowserSupabase();
  const [todayR, yesterdayR, weeklyR, monthlyR] = await Promise.all([
    client.from("orders").select("total").gte("created_at", todayStartISO()).lte("created_at", todayEndISO()),
    client.from("orders").select("total").gte("created_at", yesterdayStartISO()).lte("created_at", yesterdayEndISO()),
    client.from("orders").select("total").gte("created_at", daysAgoISO(7)).lte("created_at", nowISO()),
    client.from("orders").select("total").gte("created_at", daysAgoISO(30)).lte("created_at", nowISO()),
  ]);

  return {
    todayRevenue: sumTotals(todayR.data),
    yesterdayRevenue: sumTotals(yesterdayR.data),
    weeklyRevenue: sumTotals(weeklyR.data),
    monthlyRevenue: sumTotals(monthlyR.data),
    todayOrders: todayR.data?.length ?? 0,
    yesterdayOrders: yesterdayR.data?.length ?? 0,
    weeklyOrders: weeklyR.data?.length ?? 0,
    monthlyOrders: monthlyR.data?.length ?? 0,
  };
}

function emptyAnalytics(): ReportsAnalytics {
  return {
    orders: [],
    totalRevenue: 0,
    totalOrders: 0,
    aov: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    bestSellers: [],
    returningCustomers: 0,
  };
}
