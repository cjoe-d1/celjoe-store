/**
 * Production ecommerce order types.
 *
 * These types are the canonical read model for the existing
 * Celjoe production schema. They are intentionally flat and
 * numeric — money is a number, status is a typed union derived
 * from the `order_status` enum, and order line details come from
 * the `product_snapshot` JSONB column.
 *
 * Do not introduce JSON money wrappers (e.g. `{amount, currencyCode}`)
 * or reintroduce the old `status` field. The production schema is
 * the source of truth.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partial";
export type PaymentMethod = "card" | "transfer" | "cash" | "wallet" | "pos";

export type OrderTimelineEvent = {
  status: OrderStatus;
  label: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
};

export type ProductSnapshot = {
  name: string;
  slug?: string;
  image_url?: string | null;
  variant_name?: string | null;
  description?: string | null;
  short_description?: string | null;
  [key: string]: unknown;
};

export type OrderLine = {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string | null;
  productImageUrl: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus | string;
  paymentMethod: PaymentMethod | string | null;
  notes: string | null;
  items: OrderLine[];
  assignedRiderId: string | null;
  assignedRiderName: string | null;
  preparationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

const CURRENCY = "NGN";

export const formatMoney = (n: number | null | undefined): string => {
  const amount = Number(n ?? 0);
  if (Number.isNaN(amount)) return `₦0`;
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
};

export const formatMoneyExact = (n: number | null | undefined): string => {
  const amount = Number(n ?? 0);
  if (Number.isNaN(amount)) return `₦0.00`;
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export { CURRENCY };

const STATUS_LABELS: Record<OrderStatus, { label: string; description: string }> = {
  pending: {
    label: "Order received",
    description: "We've received your order and are confirming the details.",
  },
  confirmed: {
    label: "Confirmed",
    description: "The kitchen has accepted your order.",
  },
  preparing: {
    label: "Preparing",
    description: "Our chefs are cooking with care.",
  },
  ready: {
    label: "Ready",
    description: "Your order is packed and ready for the next step.",
  },
  out_for_delivery: {
    label: "On the way",
    description: "Your order is on its way to you.",
  },
  delivered: {
    label: "Delivered",
    description: "Enjoy your meal. Thank you for choosing Celjoe.",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled. Reach out if this was a mistake.",
  },
};

export const ORDER_TIMELINE: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export function buildOrderTimeline(status: OrderStatus): OrderTimelineEvent[] {
  const currentIndex = ORDER_TIMELINE.indexOf(status);
  return ORDER_TIMELINE.map((s, index) => {
    const meta = STATUS_LABELS[s];
    return {
      status: s,
      label: meta.label,
      description: meta.description,
      isComplete: currentIndex > index || status === "delivered",
      isCurrent: currentIndex === index && status !== "delivered" && status !== "cancelled",
    };
  });
}

export function statusLabel(status: OrderStatus | string): string {
  return STATUS_LABELS[status as OrderStatus]?.label ?? String(status);
}

export const isOrderStatus = (v: unknown): v is OrderStatus =>
  typeof v === "string" && v in STATUS_LABELS;

// -------------------------------------------------------------------------
// Row mappers (Supabase → Order)
// -------------------------------------------------------------------------

type OrderRow = {
  id: string;
  order_number?: string;
  orderNumber?: string;
  order_status?: string;
  status?: string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string | null;
  customerEmail?: string | null;
  customer_phone?: string | null;
  customerPhone?: string | null;
  subtotal?: number | string | null;
  delivery_fee?: number | string | null;
  deliveryFee?: number | string | null;
  tax?: number | string | null;
  total?: number | string | null;
  payment_status?: string | null;
  paymentStatus?: string | null;
  payment_method?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  assigned_rider_id?: string | null;
  assignedRiderId?: string | null;
  assigned_rider_name?: string | null;
  assignedRiderName?: string | null;
  preparation_minutes?: number | null;
  preparationMinutes?: number | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type OrderItemRow = {
  id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_snapshot?: ProductSnapshot | null;
  quantity?: number;
  unit_price?: number | string | null;
  line_total?: number | string | null;
  total_price?: number | string | null;
};

const toNumber = (v: unknown, fallback = 0): number => {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function mapOrderRow(d: OrderRow, items: OrderLine[] = []): Order {
  const rawStatus = d.order_status ?? d.status ?? "pending";
  return {
    id: d.id,
    orderNumber: d.order_number ?? d.orderNumber ?? "",
    orderStatus: (isOrderStatus(rawStatus) ? rawStatus : "pending") as OrderStatus,
    customerName: d.customer_name ?? d.customerName ?? "Guest",
    customerEmail: d.customer_email ?? d.customerEmail ?? null,
    customerPhone: d.customer_phone ?? d.customerPhone ?? null,
    subtotal: toNumber(d.subtotal),
    deliveryFee: toNumber(d.delivery_fee ?? d.deliveryFee),
    tax: toNumber(d.tax),
    total: toNumber(d.total),
    paymentStatus: d.payment_status ?? d.paymentStatus ?? "pending",
    paymentMethod: d.payment_method ?? d.paymentMethod ?? null,
    notes: d.notes ?? null,
    assignedRiderId: d.assigned_rider_id ?? d.assignedRiderId ?? null,
    assignedRiderName: d.assigned_rider_name ?? d.assignedRiderName ?? null,
    preparationMinutes: d.preparation_minutes ?? d.preparationMinutes ?? null,
    items,
    createdAt: d.created_at ?? d.createdAt ?? new Date().toISOString(),
    updatedAt: d.updated_at ?? d.updatedAt ?? new Date().toISOString(),
  };
}

export function mapOrderItemRow(it: OrderItemRow): OrderLine {
  const snapshot: ProductSnapshot = (it.product_snapshot ?? {}) as ProductSnapshot;
  return {
    id: it.id,
    productId: it.product_id ?? null,
    variantId: it.variant_id ?? null,
    productName: snapshot.name ?? "Item",
    productSlug: snapshot.slug ?? null,
    productImageUrl: snapshot.image_url ?? null,
    variantName: snapshot.variant_name ?? null,
    quantity: toNumber(it.quantity, 1),
    unitPrice: toNumber(it.unit_price),
    lineTotal: toNumber(it.line_total ?? it.total_price),
  };
}

// -------------------------------------------------------------------------
// Repositories
// -------------------------------------------------------------------------

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

/**
 * Look up an order by its public-facing order number.
 * Reads from the production `orders` and `order_items` tables.
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (!orderNumber) return null;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error.code)) return null;
      throw error;
    }
    if (!data) return null;
    const order = mapOrderRow(data as OrderRow);
    order.items = await fetchOrderItems(order.id);
    return order;
  } catch {
    return null;
  }
}

export async function getRecentOrdersForCustomer(
  email: string,
  limit = 8,
): Promise<Order[]> {
  if (!email) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: unknown) => mapOrderRow(d as OrderRow));
  } catch {
    return [];
  }
}

export async function fetchOrderItems(orderId: string): Promise<OrderLine[]> {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      return [];
    }
    return (data ?? []).map((it: unknown) => mapOrderItemRow(it as OrderItemRow));
  } catch {
    return [];
  }
}

// Imported lazily to avoid a circular import (auth → session → supabase → orders).
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { supabase } from "lib/supabase/client";
