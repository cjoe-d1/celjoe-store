import { siteConfig } from "lib/site-config";

/**
 * WhatsApp notification service.
 *
 * Phase F: Sends WhatsApp messages via the wa.me click-to-chat URL.
 * This is a lightweight approach that doesn't require Twilio setup.
 *
 * Phase G will upgrade to the Twilio REST API for programmatic sending.
 */

export type WhatsAppMessage = {
  to: string;
  body: string;
};

/**
 * Formats a phone number for WhatsApp by stripping non-digit characters
 * and ensuring it doesn't start with '+'.
 */
function sanitisePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Generate a WhatsApp click-to-chat URL.
 * Used in admin UI to provide a quick-contact button.
 */
export function waChatUrl(phone: string, body: string): string {
  const sanitised = sanitisePhone(phone);
  const encoded = encodeURIComponent(body);
  return `https://wa.me/${sanitised}?text=${encoded}`;
}

/**
 * Send a WhatsApp notification (server-side).
 *
 * Currently logs the message. Phase G will add Twilio API integration.
 * Returns true if the admin WhatsApp number is configured.
 */
export async function sendWhatsAppNotification(
  message: WhatsAppMessage,
): Promise<{ ok: boolean; error?: string }> {
  const adminPhone = siteConfig.contact.whatsapp;

  if (!adminPhone) {
    console.warn(
      "[WhatsApp] WHATSAPP_NUMBER env var not set — notification skipped.",
    );
    return { ok: false, error: "WhatsApp number not configured" };
  }

  // Phase F: log the message. Phase G will send via Twilio.
  console.log(
    `[WhatsApp] Notification queued:\n  To: ${message.to}\n  Body: ${message.body}`,
  );

  // Attempt Twilio if credentials are configured (future-proofing)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && twilioPhone) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require("twilio");
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        from: `whatsapp:${twilioPhone}`,
        to: `whatsapp:${sanitisePhone(message.to)}`,
        body: message.body,
      });
      return { ok: true };
    } catch (err) {
      console.error("[WhatsApp] Twilio send failed:", err);
      return { ok: false, error: "Twilio send failed" };
    }
  }

  // No Twilio configured — this is expected in Phase F.
  console.log(
    "[WhatsApp] Twilio not configured. Use the wa.me link in the admin UI.",
  );
  return { ok: true };
}

/**
 * Build a quotation notification message for the admin.
 */
export function buildAdminQuotationAlert(quote: {
  quote_number: string;
  customer_name: string;
  customer_phone: string;
  event_type?: string | null;
  guest_count?: number | null;
  event_date?: string | null;
}): string {
  const lines = [
    `📋 *New Quotation Request* — ${quote.quote_number}`,
    `Customer: ${quote.customer_name}`,
    `Phone: ${quote.customer_phone}`,
  ];
  if (quote.event_type) lines.push(`Event: ${quote.event_type}`);
  if (quote.guest_count) lines.push(`Guests: ${quote.guest_count}`);
  if (quote.event_date) lines.push(`Date: ${quote.event_date}`);
  lines.push(`Review: ${siteConfig.url}/admin/quotations`);
  return lines.join("\n");
}

/**
 * Build a quotation response message for the customer.
 */
export function buildCustomerQuotationMessage(quote: {
  quote_number: string;
  status: string;
  quoted_amount?: number | null;
}): string {
  const lines = [
    `Hello! Your quotation *${quote.quote_number}* has been updated to *${quote.status}*.`,
  ];
  if (quote.quoted_amount) {
    lines.push(
      `Amount: ₦${Number(quote.quoted_amount).toLocaleString("en-NG")}`,
    );
  }
  lines.push(`View details: ${siteConfig.url}/track-order?quote=${quote.quote_number}`);
  return lines.join("\n");
}
