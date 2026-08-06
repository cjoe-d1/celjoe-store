/**
 * Paystack webhook signature verification.
 *
 * Every incoming webhook request from Paystack is signed with
 * HMAC-SHA-512 using the secret key. We verify this signature
 * before processing any webhook event to prevent spoofing.
 *
 * Reference: https://paystack.com/docs/payments/webhooks/
 */

import { createHmac } from "node:crypto";

/** Paystack secret key — same as the one used for API calls. */
function paystackSecretKey(): string {
  const key =
    process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_SECRET ?? "";
  return key;
}

/**
 * Verify that an incoming webhook request genuinely came from Paystack.
 *
 * @param rawBody  The raw, un-parsed request body (string).
 * @param signatureHeader  The value of the `x-paystack-signature` header.
 * @returns `true` if the signature matches; `false` otherwise.
 */
export function verifyPaystackWebhook(
  rawBody: string,
  signatureHeader: string,
): boolean {
  if (!signatureHeader || !rawBody) return false;

  try {
    const hash = createHmac("sha512", paystackSecretKey())
      .update(rawBody)
      .digest("hex");

    return hash === signatureHeader;
  } catch {
    return false;
  }
}

/**
 * Validate that the webhook event type is one we handle.
 */
export function isValidWebhookEvent(
  event: unknown,
): event is "charge.success" | "charge.failed" | "transfer.success" | "transfer.failed" {
  if (typeof event !== "string") return false;
  return [
    "charge.success",
    "charge.failed",
    "transfer.success",
    "transfer.failed",
  ].includes(event);
}
