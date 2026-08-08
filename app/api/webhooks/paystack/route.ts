/**
 * Paystack Webhook Receiver
 *
 * Security:
 *  - HMAC-SHA-512 signature verified BEFORE body is parsed.
 *  - After signature verification, the event is delegated to
 *    processPaystackWebhook which re-verifies with Paystack API.
 *  - Rate-limited at 30 requests/minute/IP.
 *  - Returns appropriate HTTP status for Paystack retry logic.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPaystackWebhook } from "lib/paystack/webhook";
import { processPaystackWebhook } from "lib/actions/payments";
import { checkRateLimit } from "lib/security/rate-limit";

export async function POST(req: Request): Promise<Response> {
  // ---- Rate limiting ----
  const ip = (await headers()).get("x-forwarded-for") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`paystack-webhook:${ip}`, 30, 60_000)) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  // ---- Verify HMAC-SHA-512 signature BEFORE reading the body ----
  const rawBody = await req.text();
  const sigHeader = (await headers()).get("x-paystack-signature");

  if (!sigHeader) {
    return NextResponse.json(
      { message: "Missing signature." },
      { status: 401 },
    );
  }

  let payload: { event: string; data: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!verifyPaystackWebhook(rawBody, sigHeader)) {
    console.warn("[Paystack Webhook] Invalid signature from IP:", ip);
    return NextResponse.json(
      { message: "Invalid signature." },
      { status: 401 },
    );
  }

  // ---- Process the verified event ----
  const eventType = payload.event ?? "unknown";
  const data = payload.data as { reference?: string };
  console.log(`[Paystack Webhook] Received event: ${eventType}, ref: ${data?.reference ?? "N/A"}`);

  const result = await processPaystackWebhook({
    event: eventType,
    data: { reference: data?.reference ?? "" },
  });

  if (result.ok) {
    return NextResponse.json({ status: result.status }, { status: 200 });
  }

  // Non-ok: return appropriate status based on shouldRetry
  if (result.shouldRetry) {
    // Transient failure (e.g. DB down) — Paystack will retry.
    return NextResponse.json(
      { error: result.error },
      { status: 503 },
    );
  }

  // Permanent failure (bad data, amount mismatch, etc.) — acknowledge to
  // stop retries.
  return NextResponse.json({ error: result.error }, { status: 200 });
}
