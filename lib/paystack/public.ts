/**
 * Paystack public utilities — browser-safe.
 *
 * This module exports ONLY the public key. It is safe to import
 * from client components, `"use client"` files, and browser bundles.
 *
 * The secret key, API calls, and transaction logic live in
 * `lib/paystack/index.ts` which MUST NOT be imported client-side.
 */

/** Paystack public key — safe for client-side inline widget. */
export function paystackPublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ??
    process.env.PAYSTACK_PUBLIC_KEY ?? "";
  if (!key) throw new Error("Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY environment variable");
  return key;
}
