/**
 * Notification message service.
 *
 * Phase G (current):
 *   - WhatsApp: customer-driven (wa.me link, not server-side API)
 *   - Admin: Push Notifications (via lib/push/send.ts)
 *
 * This module now serves as:
 *   1. WhatsApp click-to-chat URL builder (wa.me)
 *   2. Message template library (reusable for WhatsApp, Push, Email, SMS)
 *   3. Customer notification helpers (wa.me or push fallback)
 *
 * Server-side WhatsApp provider (lib/providers/whatsapp/) is preserved
 * for future Meta Cloud API / Evolution API integration. Currently inactive.
 */

// --------------------------------------------------------------------------
// Re-export templates
// --------------------------------------------------------------------------
export {
  buildAdminQuotationAlert,
  buildCustomerQuotationMessage,
} from "lib/notifications/templates/quotations";
export {
  buildAdminNewOrderAlert,
  buildCustomerOrderConfirmation,
  buildCustomerOrderReady,
} from "lib/notifications/templates/orders";

// --------------------------------------------------------------------------
// Phone helpers
// --------------------------------------------------------------------------

/**
 * Sanitise and normalise a phone number for WhatsApp deep-linking.
 *
 * WhatsApp wa.me URLs accept numbers in E.164 format (with or without +).
 * We enforce the `+` prefix for maximum mobile deep-link compatibility
 * across Android, iPhone, and WhatsApp Web.
 */
function normalisePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  // Strip any existing + so we can re-add it consistently
  cleaned = cleaned.replace(/^\+/, "");
  return `+${cleaned}`;
}

/**
 * Generate a WhatsApp click-to-chat URL.
 *
 * Uses `wa.me` (the official short domain) which auto-detects:
 *   - Mobile with WhatsApp installed → opens native app directly
 *   - Desktop / no app → redirects to web.whatsapp.com
 *
 * The `+` sign is URL-safe in modern browsers and ensures the
 * international number is recognised correctly on all platforms.
 */
export function waChatUrl(phone: string, body: string): string {
  const normalised = normalisePhone(phone);
  const encoded = encodeURIComponent(body);
  return `https://wa.me/${normalised}?text=${encoded}`;
}

// --------------------------------------------------------------------------
// Quotation — customer-facing WhatsApp prefilled message
// --------------------------------------------------------------------------

/**
 * Build a concise, customer-friendly WhatsApp prefilled message.
 *
 * Unlike the admin alert (verbose with emoji header), this template is
 * optimised for the customer to review and send in one tap. It keeps
 * the URL shorter and the chat experience cleaner.
 */
export function buildCustomerQuotationWaText(quote: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  event_type?: string | null;
  guest_count?: number | null;
  event_date?: string | null;
  notes?: string | null;
  quote_number: string;
}): string {
  const lines: string[] = [
    `Hello CELJOE, I just submitted a quotation request.`,
    ``,
    `Name: ${quote.customer_name}`,
    `Phone: ${quote.customer_phone}`,
  ];

  if (quote.customer_email) lines.push(`Email: ${quote.customer_email}`);
  if (quote.event_type) lines.push(`Event: ${quote.event_type}`);
  if (quote.guest_count) lines.push(`Guests: ${quote.guest_count}`);
  if (quote.event_date) lines.push(`Date: ${quote.event_date}`);
  if (quote.notes) lines.push(`Notes: ${quote.notes}`);

  lines.push(``, `Reference: ${quote.quote_number}`);

  return lines.join("\n");
}
