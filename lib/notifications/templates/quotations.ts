/**
 * Quotation notification message templates.
 *
 * Pure functions — no side effects, no provider calls.
 * NotificationService selects the template and delegates
 * sending to the provider layer.
 */

const NL = "\n";

export function buildAdminQuotationAlert(quote: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  event_type?: string | null;
  guest_count?: number | null;
  event_date?: string | null;
  notes?: string | null;
  quote_number?: string;
}): string {
  const lines: string[] = [
    "\u{1F4CB} *NEW QUOTATION REQUEST*",
    "",
    `Customer:${NL}${quote.customer_name}`,
    "",
    `Phone:${NL}${quote.customer_phone}`,
  ];

  if (quote.customer_email) {
    lines.push("", `Email:${NL}${quote.customer_email}`);
  }
  if (quote.event_type) {
    lines.push("", `Event:${NL}${quote.event_type}`);
  }
  if (quote.guest_count) {
    lines.push("", `Guests:${NL}${quote.guest_count}`);
  }
  if (quote.event_date) {
    lines.push("", `Date:${NL}${quote.event_date}`);
  }
  if (quote.notes) {
    lines.push("", `Notes:${NL}${quote.notes}`);
  }

  if (quote.quote_number) {
    lines.push("", `Reference:${NL}${quote.quote_number}`);
  }

  return lines.join(NL);
}

export function buildCustomerQuotationMessage(quote: {
  quote_number: string;
  status: string;
  quoted_amount?: number | null;
}): string {
  const statusLabel =
    quote.status === "quoted"
      ? "has been priced"
      : quote.status === "accepted"
        ? "has been accepted"
        : `updated to ${quote.status}`;

  const lines: string[] = [
    `Hello! Your quotation *${quote.quote_number}* ${statusLabel}.`,
  ];

  if (quote.quoted_amount && quote.quoted_amount > 0) {
    const amount = Number(quote.quoted_amount).toLocaleString("en-NG");
    lines.push("", `Amount: \u20A6${amount}`);
  }

  return lines.join(NL);
}
