"use server";

/**
 * Payment Server Actions — Phase J.2
 *
 * Handles Paystack payment initialisation, verification, and
 * order status synchronisation. All server actions require
 * RBAC authorisation where applicable.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  initializeTransaction,
  verifyTransaction,
  toKobo,
  fromKobo,
  generateReference,
  type PaystackVerifyResponse,
} from "lib/paystack";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata, getCurrentCustomerSession } from "lib/auth/session";
import { supabase } from "lib/supabase/client";
import { CURRENCY } from "lib/supabase/orders";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ActionResult = { ok: true } | { ok: false; error: string };

// --------------------------------------------------------------------------
// Payment initialisation (customer-facing)
// --------------------------------------------------------------------------

/**
 * Initialise a Paystack payment and redirect the customer to the
 * payment page.
 *
 * Expected form data:
 *   - amount: total in Naira (number)
 *   - email: customer email
 *   - order_type: "product" | "catering_deposit" | "balance"
 *   - metadata: JSON string of additional context (cart items, etc.)
 *   - callback_url: URL to return to after payment
 *   - customer_name: optional
 *   - customer_phone: optional
 */
export async function initiatePaymentAction(
  formData: FormData,
): Promise<void> {
  const rawAmount = String(formData.get("amount") ?? "0");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const orderType = String(formData.get("order_type") ?? "product");
  const rawMeta = String(formData.get("metadata") ?? "{}");
  const callbackUrl = String(formData.get("callback_url") ?? "");
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();

  const amountNaira = Number(rawAmount);
  if (!amountNaira || amountNaira <= 0 || Number.isNaN(amountNaira)) {
    redirect(`/cart?error=${encodeURIComponent("Invalid payment amount.")}`);
  }

  if (!email) {
    redirect(`/cart?error=${encodeURIComponent("Email is required for payment.")}`);
  }

  let metadata: Record<string, unknown>;
  try {
    metadata = JSON.parse(rawMeta);
  } catch {
    metadata = {};
  }

  const reference = generateReference();

  try {
    const resp = await initializeTransaction({
      amount: toKobo(amountNaira),
      email,
      reference,
      currency: CURRENCY,
      metadata: {
        ...metadata,
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone,
      },
      callback_url: callbackUrl,
    });

    // Store a pending payment record
    const { error } = await supabase.from("payments").insert({
      reference,
      amount: amountNaira,
      currency: CURRENCY,
      status: "pending",
      payment_method: "paystack",
      email,
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: orderType,
      metadata,
      access_code: resp.access_code,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Paystack] Failed to store payment record:", error.message);
    }

    // Redirect customer to Paystack payment page
    redirect(resp.authorization_url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initialisation failed.";
    redirect(`/cart?error=${encodeURIComponent(message)}`);
  }
}

// --------------------------------------------------------------------------
// Payment verification (callback handler)
// --------------------------------------------------------------------------

/**
 * Verify a completed/cancelled Paystack payment via the callback URL.
 *
 * Expected search params:
 *   - reference: Paystack transaction reference
 *   - trxref:  Paystack alternate reference param
 */
export async function verifyPaymentAction(
  reference: string,
): Promise<ActionResult & { status?: string }> {
  if (!reference) return { ok: false, error: "Missing payment reference." };

  try {
    const data = await verifyTransaction(reference);
    if (!data) {
      return { ok: false, error: "Payment verification failed.", status: "pending" };
    }

    // Update the payment record
    await supabase
      .from("payments")
      .update({
        status: data.status === "success" ? "completed" : data.status,
        paystack_data: data as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    // If payment was successful, update the related order
    if (data.status === "success") {
      const { data: paymentRow } = await supabase
        .from("payments")
        .select("order_id")
        .eq("reference", reference)
        .maybeSingle();

      if (paymentRow?.order_id) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_method: "paystack",
            payment_reference: reference,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentRow.order_id);
      }
    }

    revalidatePath("/checkout/result");
    return {
      ok: true,
      status: data.status,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment verification error.";
    return { ok: false, error: message, status: "error" };
  }
}

// --------------------------------------------------------------------------
// Admin: Fetch payment details
// --------------------------------------------------------------------------

export async function getPaymentByReference(
  reference: string,
): Promise<PaystackVerifyResponse["data"] | null> {
  try {
    await requireAdmin();
    return await verifyTransaction(reference);
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// Webhook event processor (called by the webhook route)
// --------------------------------------------------------------------------

/**
 * Process a verified Paystack webhook event.
 *
 * This is called by the webhook route handler AFTER signature
 * verification has passed.
 */
export async function processPaystackWebhook(
  event: { event: string; data: PaystackVerifyResponse["data"] },
): Promise<{ ok: boolean }> {
  const { event: eventType, data } = event;

  try {
    switch (eventType) {
      case "charge.success": {
        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "completed",
            paystack_data: data as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("reference", data.reference);

        // If linked to an order, update order payment status
        const { data: paymentRow } = await supabase
          .from("payments")
          .select("order_id, order_type")
          .eq("reference", data.reference)
          .maybeSingle();

        if (paymentRow?.order_id) {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              payment_method: "paystack",
              payment_reference: data.reference,
              order_status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentRow.order_id);
        }

        break;
      }

      case "charge.failed": {
        await supabase
          .from("payments")
          .update({
            status: "failed",
            paystack_data: data as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("reference", data.reference);

        // Update linked order
        const { data: failedPmt } = await supabase
          .from("payments")
          .select("order_id")
          .eq("reference", data.reference)
          .maybeSingle();

        if (failedPmt?.order_id) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", failedPmt.order_id);
        }

        break;
      }

      default:
        // Unhandled events are acknowledged but not processed
        break;
    }

    return { ok: true };
  } catch (err) {
    console.error("[Paystack Webhook] Processing error:", err);
    return { ok: false };
  }
}
