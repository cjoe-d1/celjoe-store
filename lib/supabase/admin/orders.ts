import { db } from "lib/supabase/admin";
import {
  fetchOrderItems,
  mapOrderRow,
  type Order,
  type OrderStatus,
} from "lib/supabase/orders";

export type AdminOrder = Order & {
  itemsCount: number;
};

export type OrderListFilters = {
  status?: OrderStatus | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedOrders = {
  orders: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export async function listAdminOrders(
  filters: OrderListFilters = {},
): Promise<PaginatedOrders> {
  const {
    status = "all",
    search = "",
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = filters;

  const fromRow = (page - 1) * pageSize;
  const toRow = fromRow + pageSize - 1;

  try {
    let query = db
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(fromRow, toRow);

    if (status !== "all") query = query.eq("order_status", status);
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`,
      );
    }
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);

    const { data, error, count } = await query;
    if (error) {
      if (isMissingTable(error.code)) {
        return { orders: [], total: 0, page, pageSize, totalPages: 0 };
      }
      throw error;
    }

    const rawOrders = (data ?? []) as Array<Parameters<typeof mapOrderRow>[0]>;
    const orders: AdminOrder[] = rawOrders.map((d) => {
      const order = mapOrderRow(d);
      const adminOrder = order as AdminOrder;
      adminOrder.itemsCount = 0;
      return adminOrder;
    });

    // Batch-fetch item counts for all orders on this page
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const { data: countsData, error: countsError } = await db
        .from("order_items")
        .select("order_id")
        .in("order_id", orderIds);
      if (!countsError && countsData) {
        const countByOrder = new Map<string, number>();
        for (const row of countsData as Array<{ order_id: string }>) {
          countByOrder.set(row.order_id, (countByOrder.get(row.order_id) ?? 0) + 1);
        }
        for (const o of orders) {
          o.itemsCount = countByOrder.get(o.id) ?? 0;
        }
      }
    }

    return {
      orders,
      total: count ?? orders.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? orders.length) / pageSize)),
    };
  } catch {
    return { orders: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

export async function getAdminOrderById(id: string): Promise<AdminOrder | null> {
  try {
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isMissingTable(error.code)) return null;
      throw error;
    }
    if (!data) return null;

    const order = mapOrderRow(data as Parameters<typeof mapOrderRow>[0]);
    const items = await fetchOrderItems(order.id, db);
    const adminOrder: AdminOrder = {
      ...order,
      items,
      itemsCount: items.length,
    };
    return adminOrder;
  } catch {
    return null;
  }
}

export async function getAdminOrderItems(orderId: string): Promise<Order["items"]> {
  return fetchOrderItems(orderId, db);
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await db
      .from("orders")
      .update({
        order_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (error) {
      if (isMissingTable(error.code)) {
        return { ok: false, error: "Orders table unavailable." };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}
