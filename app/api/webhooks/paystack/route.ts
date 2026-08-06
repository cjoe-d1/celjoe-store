/**
 * Paystack Webhook Handler — Phase J.2
 *
 * Receives payment events from Paystack, verifies signatures,
 * and updates order/payment records accordingly.
 *
 * Paystack sends:
 *   - charge.success
 *   - charge.failed
 *   - transfer.success
 *   - transfer.failed
 *
 * Every request is HMAC-SHA-512 signed. We verify before
 * processing any event.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhook, isValidWebhookEvent } from "lib/paystack/webhook";
import { processPaystackWebhook } from "lib/actions/payments";
import { checkRateLimit, getRateLimitKey } from "lib/security/rate-limit";

/** Paystack webhooks are rate-limited to prevent replay/abuse. */
const WEBHOOK_RATE_LIMIT = 30; // requests per minute per IP
const WEBHOOK_WINDOW_MS = 60_000; // 1 minute

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate-limit webhook requests
  const rlKey = getRateLimitKey(request);
  if (!checkRateLimit(rlKey, WEBHOOK_RATE_LIMIT, WEBHOOK_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  // Read the raw body BEFORE any parsing (required for signature verification)
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  // Verify webhook signature
  if (!verifyPaystackWebhook(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  // Parse the verified body
  let payload: { event: string; data: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Validate event type
  if (!isValidWebhookEvent(payload.event)) {
    // Acknowledge unhandled events (Paystack expects 200)
    return NextResponse.json({ received: true });
  }

  // Process the event
  const result = await processPaystackWebhook({
    event: payload.event,
    data: payload.data as Parameters<typeof processPaystackWebhook>[0]["data"],
  });

  if (!result.ok) {
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true, processed: false });
  }

  return NextResponse.json({ received: true, processed: true });
}

/**
 * payloadTooLarge must be set in next.config if receiving
 * large webhook payloads. Paystack events are typically small.
 */
export const dynamic = "force-dynamic";
