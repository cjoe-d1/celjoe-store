"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
import type { OrderStatus } from "lib/supabase/orders";
import {
  notifyCustomerOrderConfirmed,
  notifyCustomerOrderReady,
} from "lib/services/whatsapp";

type ActionResult = { ok: true } | { ok: false; error: string };

const logFailure = async (err: unknown, fallback: string): Promise<string> => {
  if (err instanceof Error) return err.message;
  return fallback;
};

export async function acceptOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data, error } = await db.from("orders")
      .update({
        order_status: "confirmed" satisfies OrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, order_number, customer_name, customer_phone, total")
      .single();

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "order.accept", "orders", orderId, {
        orderNumber: data?.order_number,
      }, ip, userAgent),
    );

    // Notify customer (non-blocking — DB always wins)
    if (data) {
      notifyCustomerOrderConfirmed({
        order_number: data.order_number,
        customer_name: data.customer_name ?? "Valued Customer",
        customer_phone: data.customer_phone,
        total: Number(data.total ?? 0),
        items_count: 0, // items count not needed for confirmation
      }).catch((waErr) =>
        console.error("[Orders] Confirmation notification failed:", waErr),
      );
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: await logFailure(err, "Failed to accept order.") };
  }
}

export async function rejectOrderAction(
  orderId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data, error } = await db.from("orders")
      .update({
        order_status: "cancelled" satisfies OrderStatus,
        cancelled_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, order_number")
      .single();

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "order.reject", "orders", orderId, {
        orderNumber: data?.order_number,
        reason,
      }, ip, userAgent),
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: await logFailure(err, "Failed to reject order.") };
  }
}

export async function cancelOrderAction(
  orderId: string,
  reason: string,
): Promise<ActionResult> {
  return rejectOrderAction(orderId, reason);
}

export async function refundOrderAction(
  orderId: string,
  amount: number,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data, error } = await db.from("orders")
      .update({
        payment_status: "refunded",
        refunded_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, order_number")
      .single();

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "order.refund", "orders", orderId, {
        orderNumber: data?.order_number,
        amount,
      }, ip, userAgent),
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: await logFailure(err, "Failed to refund order.") };
  }
}

export async function markOrderPreparingAction(orderId: string): Promise<ActionResult> {
  return transitionOrderAction(orderId, "preparing", "order.mark_preparing");
}

export async function markOrderReadyAction(orderId: string): Promise<ActionResult> {
  return transitionOrderAction(orderId, "ready", "order.mark_ready");
}

export async function markOrderCompletedAction(orderId: string): Promise<ActionResult> {
  return transitionOrderAction(orderId, "completed", "order.mark_completed");
}

export async function recallOrderAction(orderId: string): Promise<ActionResult> {
  return transitionOrderAction(orderId, "preparing", "order.recall");
}

export async function updateOrderNotesAction(
  orderId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("orders")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "order.update_notes", "orders", orderId, { notes }, ip, userAgent),
    );

    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: await logFailure(err, "Failed to update notes.") };
  }
}

async function transitionOrderAction(
  orderId: string,
  nextStatus: OrderStatus,
  action: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data, error } = await db.from("orders")
      .update({
        order_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, order_number, customer_name, customer_phone")
      .single();

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, action, "orders", orderId, {
        orderNumber: data?.order_number,
        nextStatus,
      }, ip, userAgent),
    );

    // Notify customer when order is ready (non-blocking)
    if (nextStatus === "ready" && data) {
      notifyCustomerOrderReady({
        order_number: data.order_number,
        customer_name: data.customer_name ?? "Valued Customer",
        customer_phone: data.customer_phone,
      }).catch((waErr) =>
        console.error("[Orders] Ready notification failed:", waErr),
      );
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: await logFailure(err, "Failed to update order status.") };
  }
}

export async function bulkTransitionOrdersAction(
  orderIds: string[],
  nextStatus: OrderStatus,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (orderIds.length === 0) return { ok: true };

    const { error } = await db.from("orders")
      .update({ order_status: nextStatus, updated_at: new Date().toISOString() })
      .in("id", orderIds);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "order.bulk_transition", "orders", null, {
        orderIds,
        nextStatus,
        count: orderIds.length,
      }, ip, userAgent),
    );

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: await logFailure(err, "Failed to update orders.") };
  }
}
