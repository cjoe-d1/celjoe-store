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

function sanitisePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Generate a WhatsApp click-to-chat URL.
 *
 * Used in:
 *   - Admin UI: quick-contact button for customers
 *   - Quotation success screen: prefilled message for customer
 */
export function waChatUrl(phone: string, body: string): string {
  const sanitised = sanitisePhone(phone);
  const encoded = encodeURIComponent(body);
  return `https://wa.me/${sanitised}?text=${encoded}`;
}

// --------------------------------------------------------------------------
// Quotation — customer-facing WhatsApp prefilled message
// --------------------------------------------------------------------------

import { buildAdminQuotationAlert } from "lib/notifications/templates/quotations";

/**
 * Build a prefilled WhatsApp message for customer quotation summary.
 *
 * The customer manually sends this via wa.me after their quotation
 * is saved to the database. The quote_number is always included.
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
  return buildAdminQuotationAlert(quote);
}
