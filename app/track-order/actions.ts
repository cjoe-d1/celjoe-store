"use server";

import { redirect } from "next/navigation";
import { getOrderByNumber, getTrackingToken } from "lib/supabase/orders";
import { db } from "lib/supabase/admin";

export async function trackOrderAction(formData: FormData) {
  const input = String(formData.get("orderNumber") ?? "").trim();
  if (!input) {
    return;
  }

  console.log("[trackOrderAction] Looking up:", input);

  // 1. Try as a cryptographically secure tracking token (preferred).
  //    Uses service-role client — tokens are non-guessable UUIDs.
  const trackingToken = await getTrackingToken(input, db);
  if (trackingToken) {
    console.log("[trackOrderAction] matched tracking token, redirecting to /track/");
    redirect(`/track/${encodeURIComponent(trackingToken)}`);
  }

  // 2. Fall back — try as a human-readable order number (e.g. CJ-XXXXXX-XXXX).
  //    Uses service-role client to bypass RLS.
  console.log("[trackOrderAction] not a tracking token, trying order_number lookup");
  const order = await getOrderByNumber(input, db);
  if (order) {
    console.log("[trackOrderAction] found order:", order.orderNumber);
    redirect(`/track-order/${encodeURIComponent(order.orderNumber)}`);
  }

  // 3. Neither matched — return to form with error.
  console.warn("[trackOrderAction] no match for:", input);
  redirect(`/track-order?number=${encodeURIComponent(input)}&notfound=1`);
}
