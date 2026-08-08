"use server";

/**
 * Payment Server Actions — Paystack Integration
 *
 * Security-first design:
 *  - All Paystack API calls use the secret key (server-side only).
 *  - Amount, currency, and status are ALWAYS verified against Paystack
 *    before updating any database record.
 *  - The browser NEVER provides the amount, reference, or status.
 *  - Both the callback and the webhook converge on the same
 *    `settlePayment` function to ensure consistent state transitions.
 *  - Idempotency is enforced at both the application and database levels.
 */

import { revalidatePath } from "next/cache";
import {
  verifyTransaction,
  fromKobo,
  type PaystackVerifyResponse,
} from "lib/paystack";
import { requireAdmin } from "lib/auth/guards";
import { db } from "lib/supabase/admin";
import { sendPushToAllAdmins } from "lib/push/send";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type VerificationResult =
  | { ok: true; status: "success" }
  | { ok: true; status: "already_processed" }
  | { ok: true; status: "pending" }
  | { ok: false; error: string; status: "error" | "amount_mismatch" | "pending" };

type WebhookResult = { ok: true; status: string } | { ok: false; error: string; shouldRetry: boolean };

// --------------------------------------------------------------------------
// Sanitized Paystack data (what we store — NEVER full response)
// --------------------------------------------------------------------------

type SanitizedPaystackData = {
  transaction_id: number;
  reference: string;
  amount_kobo: number;
  amount_naira: number;
  currency: string;
  status: string;
  channel: string;
  paid_at: string;
  fees: number;
  card_last4: string;
  card_type: string;
  bank: string;
  brand: string;
};

function sanitizePaystackData(
  data: PaystackVerifyResponse["data"],
): SanitizedPaystackData {
  return {
    transaction_id: data.id,
    reference: data.reference,
    amount_kobo: data.amount,
    amount_naira: fromKobo(data.amount),
    currency: data.currency,
    status: data.status,
    channel: data.channel,
    paid_at: data.paid_at,
    fees: data.fees,
    card_last4: data.authorization?.last4 ?? "",
    card_type: data.authorization?.card_type ?? "",
    bank: data.authorization?.bank ?? "",
    brand: data.authorization?.brand ?? "",
  };
  // Explicitly excluded: authorization_code, bin, customer object,
  // metadata, and anything else from the Paystack response.
}

// --------------------------------------------------------------------------
// Shared settlement logic (used by BOTH callback and webhook)
// --------------------------------------------------------------------------

/**
 * Settle a payment — the single path for marking a payment as
 * successful. Called by both the callback handler and the webhook.
 *
 * Security checks performed in order:
 *  1. Re-verify the transaction with Paystack (do NOT trust the caller).
 *  2. Idempotency — is this payment already completed?
 *  3. Amount match — Paystack amount === payment.amount === order.total?
 *  4. Currency match — must be NGN.
 */
async function settlePayment(
  reference: string,
  source: "callback" | "webhook",
): Promise<{ ok: boolean; message: string; shouldRetry: boolean }> {
  if (!reference) {
    return { ok: false, message: "Missing payment reference.", shouldRetry: false };
  }

  // ---- 1. Re-verify with Paystack (do NOT trust webhook payload alone) ----
  let paystackData: PaystackVerifyResponse["data"];
  try {
    const verified = await verifyTransaction(reference);
    if (!verified || verified.status !== "success") {
      return {
        ok: false,
        message: "Payment not successful or could not be verified.",
        shouldRetry: false,
      };
    }
    paystackData = verified;
  } catch {
    return {
      ok: false,
      message: "Could not reach Paystack to verify payment.",
      shouldRetry: true, // Transient network error — retry desirable
    };
  }

  const paystackAmountNaira = fromKobo(paystackData.amount);
  const paystackCurrency = paystackData.currency;

  // ---- 2. Look up the payment record ----
  const { data: paymentRow, error: paymentLookupErr } = await db
    .from("payments")
    .select("id, order_id, amount, status, reference")
    .eq("reference", reference)
    .maybeSingle();

  if (paymentLookupErr || !paymentRow) {
    console.error(`[Payments] Payment record not found for reference: ${reference}`);
    return { ok: false, message: "Payment record not found.", shouldRetry: false };
  }

  // ---- 3. Idempotency check ----
  if (paymentRow.status === "completed") {
    console.log(`[Payments] Payment ${reference} already completed — skipping.`);
    return { ok: true, message: "Already processed.", shouldRetry: false };
  }

  // ---- 4. Amount verification ----
  // Paystack verified amount MUST equal the payment attempt amount.
  const expectedAmount = Number(paymentRow.amount);
  if (Math.abs(paystackAmountNaira - expectedAmount) > 0.01) {
    console.error(
      `[Payments] AMOUNT MISMATCH for ${reference}: ` +
      `Paystack=${paystackAmountNaira}, Expected=${expectedAmount}`,
    );
    // Mark as suspicious — do NOT mark order as paid.
    await db
      .from("payments")
      .update({
        status: "failed",
        amount_verified: paystackAmountNaira,
        paystack_data: sanitizePaystackData(paystackData),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);
    return { ok: false, message: "Payment amount mismatch.", shouldRetry: false };
  }

  // ---- 5. Currency verification ----
  if (paystackCurrency !== "NGN") {
    console.error(
      `[Payments] CURRENCY MISMATCH for ${reference}: Paystack=${paystackCurrency}`,
    );
    await db
      .from("payments")
      .update({
        status: "failed",
        amount_verified: paystackAmountNaira,
        paystack_data: sanitizePaystackData(paystackData),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);
    return { ok: false, message: "Payment currency mismatch.", shouldRetry: false };
  }

  // ---- 6. Cross-verify against the order total ----
  const { data: orderRow, error: orderErr } = await db
    .from("orders")
    .select("id, total, payment_status, cart_id, order_number, customer_name")
    .eq("id", paymentRow.order_id)
    .maybeSingle();

  if (orderErr || !orderRow) {
    console.error(`[Payments] Order not found for payment: ${paymentRow.order_id}`);
    return { ok: false, message: "Order not found.", shouldRetry: false };
  }

  const orderTotal = Number(orderRow.total);
  if (Math.abs(paystackAmountNaira - orderTotal) > 0.01) {
    console.error(
      `[Payments] ORDER AMOUNT MISMATCH for ${reference}: ` +
      `Paystack=${paystackAmountNaira}, Order=${orderTotal}`,
    );
    await db
      .from("payments")
      .update({
        status: "failed",
        amount_verified: paystackAmountNaira,
        paystack_data: sanitizePaystackData(paystackData),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);
    return { ok: false, message: "Payment amount does not match order.", shouldRetry: false };
  }

  // ---- 7. Prevent re-settling an already-paid order (belt + suspenders) ----
  if (orderRow.payment_status === "paid") {
    console.log(`[Payments] Order ${orderRow.id} already paid — skipping settlement.`);
    // Still update the payment record so it's consistent.
    await db
      .from("payments")
      .update({
        status: "completed",
        amount_verified: paystackAmountNaira,
        channel: paystackData.channel,
        paystack_data: sanitizePaystackData(paystackData),
        processed_at: new Date().toISOString(),
        processed_by: source,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);
    return { ok: true, message: "Already processed.", shouldRetry: false };
  }

  // ---- 8. All checks passed — settle the payment ----
  const now = new Date().toISOString();

  // Update payment record
  const { error: paymentUpdateErr } = await db
    .from("payments")
    .update({
      status: "completed",
      amount_verified: paystackAmountNaira,
      channel: paystackData.channel,
      paystack_data: sanitizePaystackData(paystackData),
      processed_at: now,
      processed_by: source,
      updated_at: now,
    })
    .eq("id", paymentRow.id);

  if (paymentUpdateErr) {
    console.error(`[Payments] Failed to update payment record: ${paymentUpdateErr.message}`);
    return { ok: false, message: "Database update failed.", shouldRetry: true };
  }

  // Update order
  const { error: orderUpdateErr } = await db
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: "card", // Paystack channel determines actual method
      payment_reference: reference,
      order_status: "confirmed",
      updated_at: now,
    })
    .eq("id", paymentRow.order_id);

  if (orderUpdateErr) {
    console.error(`[Payments] Failed to update order: ${orderUpdateErr.message}`);
    return { ok: false, message: "Order update failed.", shouldRetry: true };
  }

  console.log(`[Payments] Payment ${reference} settled via ${source} — Order ${orderRow.id} marked paid.`);

  // ---- 9. Clear the specific cart associated with this order ----
  // Only clear after successful server-side payment verification.
  // Never clear on pending or failed payments.
  const cartId = (orderRow as Record<string, unknown>).cart_id as string | undefined;
  if (cartId) {
    try {
      // Delete cart items first (FK constraint), then the cart
      await db.from("cart_items").delete().eq("cart_id", cartId);
      await db.from("carts").delete().eq("id", cartId);
      console.log(`[Payments] Cart ${cartId} cleared for order ${orderRow.id}`);
    } catch (cartErr) {
      // Cart clearing failure is non-fatal — order is already settled.
      console.error("[Payments] Cart clearing failed:", cartErr);
    }
  }

  // ---- 10. Send push notification to admin devices ----
  // Non-blocking — push failure must not roll back settlement.
  const orderNumber = (orderRow as Record<string, unknown>).order_number as string | undefined;
  const customerName = (orderRow as Record<string, unknown>).customer_name as string | undefined;
  sendPushToAllAdmins({
    title: "New Paid Order",
    body: `${orderNumber ?? "Order"} — ${customerName ?? "Customer"} — ₦${paystackAmountNaira.toLocaleString()}`,
    url: `/admin/orders/${orderRow.id}`,
    tag: `order:${orderNumber}`,
  }).catch((pushErr) =>
    console.error("[Payments] Push notification failed:", pushErr),
  );

  return { ok: true, message: "Payment settled.", shouldRetry: false };
}

// --------------------------------------------------------------------------
// Callback verification (customer-facing, from /checkout/result)
// --------------------------------------------------------------------------

/**
 * Verify a payment from the callback URL.
 *
 * The browser ONLY provides the reference — we verify everything
 * server-side against Paystack.
 */
export async function verifyPaymentAction(
  reference: string,
): Promise<VerificationResult> {
  if (!reference) {
    return { ok: false, error: "Missing payment reference.", status: "error" };
  }

  try {
    // First, check if we have a payment record for this reference.
    const { data: paymentRow } = await db
      .from("payments")
      .select("status")
      .eq("reference", reference)
      .maybeSingle();

    if (!paymentRow) {
      return { ok: false, error: "Payment record not found.", status: "error" };
    }

    // If already completed, return early.
    if (paymentRow.status === "completed") {
      revalidatePath("/checkout/result");
      return { ok: true, status: "already_processed" };
    }

    // If already failed, we can't reverse it via callback.
    if (paymentRow.status === "failed") {
      return { ok: false, error: "This payment attempt was not successful.", status: "error" };
    }

    // Attempt settlement.
    const result = await settlePayment(reference, "callback");

    if (result.ok) {
      revalidatePath("/checkout/result");
      return { ok: true, status: "success" };
    }

    // The payment might still be pending (customer hasn't completed it)
    return { ok: true, status: "pending" };
  } catch {
    // Never expose raw errors to the customer.
    return {
      ok: false,
      error: "Payment could not be verified. Please contact support if the issue persists.",
      status: "error",
    };
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
// Customer-facing: Get order details by payment reference
// --------------------------------------------------------------------------

export type OrderResultDetails = {
  orderId: string;
  orderNumber: string;
  trackingToken: string;
};

/**
 * Look up order details by payment reference.
 *
 * Called from the payment result page to display order info
 * after successful payment. No auth required — the reference
 * alone is sufficient because the caller already proved they
 * initiated the payment (they have the reference from the URL,
 * which was generated server-side during checkout).
 */
export async function getOrderDetailsByReference(
  reference: string,
): Promise<OrderResultDetails | null> {
  if (!reference) return null;

  try {
    const { data: paymentRow, error: paymentErr } = await db
      .from("payments")
      .select("order_id")
      .eq("reference", reference)
      .maybeSingle();

    if (paymentErr || !paymentRow) return null;

    const { data: orderRow, error: orderErr } = await db
      .from("orders")
      .select("id, order_number, tracking_token")
      .eq("id", paymentRow.order_id)
      .maybeSingle();

    if (orderErr || !orderRow) return null;

    return {
      orderId: orderRow.id as string,
      orderNumber: orderRow.order_number as string,
      trackingToken: orderRow.tracking_token as string,
    };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// Webhook event processor (called by the webhook route AFTER signature check)
// --------------------------------------------------------------------------

/**
 * Process a verified Paystack webhook event.
 *
 * The webhook route already verified the HMAC-SHA-512 signature.
 * We re-verify the transaction with Paystack anyway (defense in depth).
 *
 * Returns `shouldRetry: true` for transient failures that warrant a
 * Paystack retry (e.g. database temporarily unavailable).
 */
export async function processPaystackWebhook(
  event: { event: string; data: { reference: string } },
): Promise<WebhookResult> {
  const { event: eventType, data } = event;
  const reference = data?.reference;

  if (!reference) {
    return { ok: false, error: "Missing reference in webhook payload.", shouldRetry: false };
  }

  try {
    switch (eventType) {
      case "charge.success": {
        const result = await settlePayment(reference, "webhook");
        if (result.ok) {
          return { ok: true, status: "settled" };
        }
        return { ok: false, error: result.message, shouldRetry: result.shouldRetry };
      }

      case "charge.failed": {
        // Mark the payment attempt as failed.
        // The order stays as "pending" so the customer can retry.
        const { data: paymentRow, error: lookupErr } = await db
          .from("payments")
          .select("id, status")
          .eq("reference", reference)
          .maybeSingle();

        if (lookupErr) {
          return { ok: false, error: "Database lookup failed.", shouldRetry: true };
        }

        if (!paymentRow) {
          return { ok: false, error: "Payment record not found.", shouldRetry: false };
        }

        // Idempotency: don't overwrite a completed payment.
        if (paymentRow.status === "completed") {
          return { ok: true, status: "already_settled" };
        }

        // Only update if still pending (don't re-mark an already-failed payment).
        if (paymentRow.status === "pending") {
          await db
            .from("payments")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentRow.id);

          // Note: we do NOT update the order payment_status.
          // The order remains "pending" so the customer can retry payment.
        }

        return { ok: true, status: "marked_failed" };
      }

      default:
        // Unhandled events — acknowledge to prevent Paystack retries.
        return { ok: true, status: "unhandled_event" };
    }
  } catch (err) {
    console.error("[Payments] Webhook processing error:", err);
    return { ok: false, error: "Internal processing error.", shouldRetry: true };
  }
}
