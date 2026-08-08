"use server";

/**
 * Checkout Server Actions — Paystack Integration
 *
 * Security-first design:
 *  - Cart is retrieved server-side via cookie (browser never sends cart data).
 *  - Product/variant prices are fetched from the database (browser never sends prices).
 *  - All totals are recalculated server-side.
 *  - The payment reference is generated server-side (never from browser).
 *  - The callback URL is constructed from a trusted origin (never from browser).
 */

import { cookies } from "next/headers";
import { createSupabaseClient } from "lib/supabase/client";
import { db } from "lib/supabase/admin";
import {
  initializeTransaction,
  toKobo,
  generateReference,
  CURRENCY,
} from "lib/paystack";
import { CURRENCY_CODE } from "lib/format-currency";
import { getCurrentCustomerSession } from "lib/auth/session";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type CheckoutInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: "standard" | "pickup";
  addressLine1: string;
  city: string;
  state: string;
  deliveryInstructions: string;
};

type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      paymentReference: string;
      authorizationUrl: string;
      trackingToken: string;
    }
  | { ok: false; error: string };

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const STANDARD_DELIVERY_FEE = 2500; // NGN — server-authoritative
const STORE_PICKUP_FEE = 0;

const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000";

// --------------------------------------------------------------------------
// Cart retrieval (server-side, cookie-based — never trusts browser)
// --------------------------------------------------------------------------

type CartItemRow = {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
};

type CartWithItems = {
  cartId: string;
  items: CartItemRow[];
};

async function getCartForCheckout(): Promise<CartWithItems> {
  const cookieStore = await cookies();
  const cartToken = cookieStore.get("cartToken")?.value;

  if (!cartToken) {
    throw new Error("No cart found. Please add items to your cart first.");
  }

  const cartClient = createSupabaseClient({ "x-cart-token": cartToken });

  const { data: cartRow, error: cartError } = await cartClient
    .from("carts")
    .select("id, token")
    .eq("token", cartToken)
    .maybeSingle();

  if (cartError || !cartRow) {
    throw new Error("Cart session expired. Please refresh the page.");
  }

  const { data: cartItems, error: itemsError } = await cartClient
    .from("cart_items")
    .select("id, product_id, variant_id, quantity")
    .eq("cart_id", cartRow.id);

  if (itemsError) {
    throw new Error("Could not read cart items. Please try again.");
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error("Your cart is empty. Please add items before checkout.");
  }

  return {
    cartId: cartRow.id,
    items: cartItems as unknown as CartItemRow[],
  };
}

// --------------------------------------------------------------------------
// Price resolution (fetched from DB — never from browser)
// --------------------------------------------------------------------------

type ResolvedLineItem = {
  cartItemId: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  variantName: string;
  optionValues: { name: string; value: string }[];
  quantity: number;
  unitPrice: number;   // Naira — fetched from DB
  lineTotal: number;
};

async function resolveLineItems(
  cart: CartWithItems,
): Promise<ResolvedLineItem[]> {
  if (cart.items.length === 0) return [];

  const variantIds = cart.items.map((i) => i.variant_id);

  // Fetch variant prices + product details from DB using service role
  // (the cart client can only read from cart tables)
  const { data: variants, error: varError } = await db
    .from("product_variants")
    .select(
      "id, name, price, option_values, product:products(id, name, slug, images:product_images(id, image_url, display_order))",
    )
    .in("id", variantIds);

  if (varError || !variants) {
    throw new Error("Could not verify product prices. Please try again.");
  }

  const varMap = new Map(
    (variants as any[]).map((v: any) => [v.id as string, v]),
  );

  return cart.items.map((ci) => {
    const v = varMap.get(ci.variant_id);
    if (!v) {
      throw new Error("A product in your cart is no longer available. Please update your cart.");
    }

    const product = v.product as any;
    const unitPrice = Number(v.price ?? 0);
    const quantity = ci.quantity;

    const images = (product?.images ?? []) as any[];
    const heroImage = images.sort(
      (a: any, b: any) => (a.display_order ?? 999) - (b.display_order ?? 999),
    )[0];

    const optionValues = Array.isArray(v.option_values)
      ? (v.option_values as any[]).map((ov) => ({
          name: String(ov?.name ?? ""),
          value: String(ov?.value ?? ""),
        }))
      : [];

    return {
      cartItemId: ci.id,
      productId: ci.product_id,
      variantId: ci.variant_id,
      productName: product?.name ?? "Product",
      productSlug: product?.slug ?? "",
      imageUrl: heroImage?.image_url ?? null,
      variantName: v.name ?? "Default",
      optionValues,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });
}

// --------------------------------------------------------------------------
// Order number generation
// --------------------------------------------------------------------------

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CJ-${ts}-${rand}`;
}

// --------------------------------------------------------------------------
// Main action: create order + initialize payment
// --------------------------------------------------------------------------

/**
 * Create an order and initialize Paystack payment.
 *
 * Called from the checkout page. The browser sends ONLY customer contact
 * info and delivery choice. Everything else (cart, prices, totals,
 * reference, callback URL) is resolved server-side.
 *
 * Returns the Paystack authorization URL for redirection, OR an error.
 */
export async function createOrderAction(
  formData: FormData,
): Promise<CreateOrderResult> {
  try {
    // ---- 1. Validate checkout input ----
    const input: CheckoutInput = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      phone: String(formData.get("phone") ?? "").trim(),
      deliveryMethod: (formData.get("deliveryMethod") as "standard" | "pickup") || "standard",
      addressLine1: String(formData.get("addressLine1") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      state: String(formData.get("state") ?? "").trim(),
      deliveryInstructions: String(formData.get("deliveryInstructions") ?? "").trim(),
    };

    if (!input.firstName || !input.lastName) {
      return { ok: false, error: "Please provide your full name." };
    }
    if (!input.email || !input.email.includes("@")) {
      return { ok: false, error: "Please provide a valid email address." };
    }
    if (!input.phone || input.phone.length < 10) {
      return { ok: false, error: "Please provide a valid phone number." };
    }
    if (!["standard", "pickup"].includes(input.deliveryMethod)) {
      return { ok: false, error: "Invalid delivery method." };
    }
    if (input.deliveryMethod === "standard") {
      if (!input.addressLine1) {
        return { ok: false, error: "Please provide your delivery address." };
      }
      if (!input.city) {
        return { ok: false, error: "Please provide your city." };
      }
      if (!input.state) {
        return { ok: false, error: "Please provide your state." };
      }
    }

    // ---- 2. Retrieve cart server-side ----
    const cart = await getCartForCheckout();

    // ---- 3. Resolve current prices from database ----
    const lineItems = await resolveLineItems(cart);
    if (lineItems.length === 0) {
      return { ok: false, error: "Your cart is empty. Please add items before checkout." };
    }

    // ---- 4. Calculate totals server-side ----
    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const deliveryFee =
      input.deliveryMethod === "pickup" ? STORE_PICKUP_FEE : STANDARD_DELIVERY_FEE;
    const tax = 0; // No tax configured for food in this jurisdiction
    const total = subtotal + deliveryFee + tax;

    const customerName = `${input.firstName} ${input.lastName}`;
    const orderNumber = generateOrderNumber();
    const paymentReference = generateReference("CELJOE");
    const trackingToken = crypto.randomUUID();

    // ---- 5. Resolve customer_id for authenticated users ----
    let customerId: string | null = null;
    try {
      const session = await getCurrentCustomerSession();
      if (session) {
        // Look up existing customer by auth_user_id
        const { data: existing } = await db
          .from("customers")
          .select("id")
          .eq("auth_user_id", session.userId)
          .maybeSingle();

        if (existing && existing.id) {
          customerId = existing.id as string;
        } else {
          // Fallback: look up by email and link auth_user_id
          const { data: fallback } = await db
            .from("customers")
            .select("id")
            .eq("email", session.email)
            .maybeSingle();

          if (fallback && fallback.id) {
            await db
              .from("customers")
              .update({ auth_user_id: session.userId })
              .eq("id", fallback.id);
            customerId = fallback.id as string;
          } else {
            // Create a new customer record
            const { data: inserted } = await db
              .from("customers")
              .insert({
                email: session.email,
                full_name: session.fullName,
                auth_user_id: session.userId,
              })
              .select("id")
              .single();

            if (inserted && inserted.id) {
              customerId = inserted.id as string;
            }
          }
        }
      }
    } catch {
      // Customer session lookup failed — proceed as guest.
      // This is non-fatal; the order still works without a customer_id.
    }

    // ---- 6. Create the order ----
    // Admin client (service role) bypasses RLS — the browser never
    // has direct access to the orders table.
    const { data: orderRow, error: orderError } = await db
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: input.email,
        customer_phone: input.phone,
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        total,
        payment_status: "pending",
        payment_method: null,
        payment_reference: null,
        order_status: "pending",
        delivery_method: input.deliveryMethod,
        address_line1: input.deliveryMethod === "standard" ? input.addressLine1 : null,
        city: input.deliveryMethod === "standard" ? input.city : null,
        state: input.deliveryMethod === "standard" ? input.state : null,
        delivery_instructions: input.deliveryInstructions || null,
        tracking_token: trackingToken,
        cart_id: cart.cartId,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !orderRow) {
      console.error("[Checkout] Order creation failed:", orderError?.message);
      return { ok: false, error: "Could not create your order. Please try again." };
    }

    const orderId = orderRow.id;

    // ---- 7. Create order_items ----
    const orderItems = lineItems.map((li) => ({
      order_id: orderId,
      product_id: li.productId,
      variant_id: li.variantId,
      product_snapshot: {
        name: li.productName,
        slug: li.productSlug,
        image_url: li.imageUrl,
        variant_name: li.variantName,
        option_values: li.optionValues,
      },
      quantity: li.quantity,
      unit_price: li.unitPrice,
      line_total: li.lineTotal,
      created_at: new Date().toISOString(),
    }));

    const { error: itemsError } = await db
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("[Checkout] Order items creation failed:", itemsError.message);
      // Order exists but without items — leave it as pending.
      // The admin can investigate.
      return { ok: false, error: "Could not create your order. Please try again." };
    }

    // ---- 8. Initialize Paystack (external service — after order is safe) ----
    let paystackData: { authorization_url: string; access_code: string; reference: string };
    try {
      paystackData = await initializeTransaction({
        amount: toKobo(total),
        email: input.email,
        reference: paymentReference,
        currency: CURRENCY,
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          platform: "CELJOE",
        },
        callback_url: `${APP_ORIGIN}/checkout/result?reference=${paymentReference}`,
      });
    } catch (paystackErr) {
      // Paystack init failed — leave the order as pending/unpaid.
      console.error("[Checkout] Paystack initialization failed:", paystackErr);
      return { ok: false, error: "Payment service is temporarily unavailable. Your order has been saved — please try paying from your account or contact support." };
    }

    // ---- 9. Create payment attempt record ----
    const { error: paymentError } = await db.from("payments").insert({
      reference: paymentReference,
      order_id: orderId,
      amount: total,
      currency: CURRENCY,
      status: "pending",
      email: input.email,
      customer_name: customerName,
      customer_phone: input.phone,
      order_type: "product",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("[Checkout] Payment record creation failed:", paymentError.message);
      // Payment was initialized at Paystack but our record failed.
      // The webhook can still recover this. Continue with the redirect.
    }

    // ---- 10. Return authorization URL + tracking token to client ----
    return {
      ok: true,
      orderId,
      orderNumber,
      paymentReference,
      authorizationUrl: paystackData.authorization_url,
      trackingToken,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    console.error("[Checkout] Unexpected error:", err);
    return { ok: false, error: message };
  }
}
