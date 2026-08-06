/**
 * Paystack Integration — Nigerian Naira (₦) payment gateway.
 *
 * Phase J.2: Full Paystack integration replacing any Shopify/Stripe
 * assumptions. Supports:
 *   - Product purchases
 *   - Catering booking deposits
 *   - Future balance payments
 *
 * Only transaction initialisation and verification are done from
 * the server. The inline pay widget runs in the browser with the
 * public key — we never touch card data on our servers.
 *
 * References: https://paystack.com/docs/api/
 */

const PAYSTACK_API = "https://api.paystack.co";

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

/** Paystack secret key — server-side only. NEVER exposed to client. */
function paystackSecretKey(): string {
  const key =
    process.env.PAYSTACK_SECRET_KEY ??
    process.env.PAYSTACK_SECRET ?? "";
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY environment variable");
  return key;
}

/** Paystack public key — safe for client-side inline widget. */
export function paystackPublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ??
    process.env.PAYSTACK_PUBLIC_KEY ?? "";
  if (!key) throw new Error("Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY environment variable");
  return key;
}

export const CURRENCY = "NGN";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type PaystackInitializeRequest = {
  /** Amount in kobo (or subunit of the currency). */
  amount: number;
  email: string;
  reference?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
  channels?: string[];
};

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: "success" | "abandoned" | "failed";
    paid_at: string;
    created_at: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
    };
    fees: number;
    paidAt: string;
    createdAt: string;
  };
};

export type PaystackWebhookEvent =
  | "charge.success"
  | "charge.failed"
  | "transfer.success"
  | "transfer.failed";

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Convert Naira amount to kobo (Paystack uses kobo). */
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Convert kobo back to Naira. */
export function fromKobo(kobo: number): number {
  return kobo / 100;
}

/** Generate a unique transaction reference. */
export function generateReference(prefix = "CELJOE"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// --------------------------------------------------------------------------
// API calls (server-side only — use secret key)
// --------------------------------------------------------------------------

async function paystackPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Paystack API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

async function paystackGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Paystack API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Initialise a Paystack transaction.
 *
 * Returns the authorisation URL, access code, and reference.
 * The caller should redirect the user to `authorization_url`.
 */
export async function initializeTransaction(
  req: PaystackInitializeRequest,
): Promise<PaystackInitializeResponse["data"]> {
  const payload = {
    email: req.email,
    amount: req.amount, // already in kobo
    currency: req.currency ?? CURRENCY,
    reference: req.reference ?? generateReference(),
    metadata: {
      ...req.metadata,
      platform: "CELJOE",
    },
    callback_url: req.callback_url,
    channels: req.channels ?? ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
  };

  const res = await paystackPost<PaystackInitializeResponse>(
    "/transaction/initialize",
    payload,
  );

  if (!res.status) {
    throw new Error(res.message || "Failed to initialise Paystack transaction.");
  }

  return res.data;
}

/**
 * Verify a Paystack transaction by reference.
 *
 * Called both from the callback URL handler AND from webhooks
 * to confirm payment before fulfilling the order.
 */
export async function verifyTransaction(
  reference: string,
): Promise<PaystackVerifyResponse["data"] | null> {
  try {
    const res = await paystackGet<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );

    if (!res.status) return null;
    if (res.data.status !== "success") return null;
    return res.data;
  } catch {
    return null;
  }
}
