/**
 * Order notification message templates.
 *
 * Pure functions — no side effects, no provider calls.
 * NotificationService selects the template and delegates
 * sending to the provider layer.
 */

const NL = "\n";

/** Notify the business owner that a new order has been placed. */
export function buildAdminNewOrderAlert(order: {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  total: number;
  items_count: number;
}): string {
  const amount = Number(order.total).toLocaleString("en-NG");
  const lines: string[] = [
    "\u{1F6A8} *NEW ORDER RECEIVED*",
    "",
    `Order:${NL}${order.order_number}`,
    "",
    `Customer:${NL}${order.customer_name}`,
  ];

  if (order.customer_phone) {
    lines.push("", `Phone:${NL}${order.customer_phone}`);
  }

  lines.push(
    "",
    `Items:${NL}${order.items_count}`,
    "",
    `Total:${NL}\u20A6${amount}`,
  );

  return lines.join(NL);
}

/** Notify the customer that their order has been confirmed. */
export function buildCustomerOrderConfirmation(order: {
  order_number: string;
  customer_name: string;
  total: number;
  items_count: number;
}): string {
  const amount = Number(order.total).toLocaleString("en-NG");
  const lines: string[] = [
    `Hello ${order.customer_name}!`,
    "",
    `Your order *${order.order_number}* has been confirmed and is being prepared.`,
    "",
    `Items: ${order.items_count}`,
    `Total: \u20A6${amount}`,
    "",
    "Thank you for choosing Celjoe!",
  ];

  return lines.join(NL);
}

/** Notify the customer that their order is ready. */
export function buildCustomerOrderReady(order: {
  order_number: string;
  customer_name: string;
}): string {
  return [
    `Hello ${order.customer_name}!`,
    "",
    `Your order *${order.order_number}* is ready!`,
    "",
    "Thank you for your patience. Enjoy your meal!",
  ].join(NL);
}
