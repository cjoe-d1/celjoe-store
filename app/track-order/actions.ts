"use server";

import { redirect } from "next/navigation";
import { getOrderByNumber } from "lib/supabase/orders";

export async function trackOrderAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  if (!orderNumber) {
    return;
  }
  const order = await getOrderByNumber(orderNumber);
  if (order) {
    redirect(`/track-order/${encodeURIComponent(order.orderNumber)}`);
  } else {
    redirect(`/track-order?number=${encodeURIComponent(orderNumber)}&notfound=1`);
  }
}
