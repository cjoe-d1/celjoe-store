import { resolveWhatsAppProvider } from "lib/providers/whatsapp";
import {
  buildAdminQuotationAlert,
  buildCustomerQuotationMessage,
} from "lib/notifications/templates/quotations";
import {
  buildAdminNewOrderAlert,
  buildCustomerOrderConfirmation,
  buildCustomerOrderReady,
} from "lib/notifications/templates/orders";

// --------------------------------------------------------------------------
// Re-export templates for backward compatibility
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
// Feature toggle
// --------------------------------------------------------------------------
// WHATSAPP_ENABLED="true"  → real WhatsApp (production)
// WHATSAPP_ENABLED != "true" → console logging only (development)

const isEnabled = (): boolean => process.env.WHATSAPP_ENABLED === "true";

// --------------------------------------------------------------------------
// Business recipient resolution
// --------------------------------------------------------------------------
// Priority chain (Phase K will swap order):
//
//   Phase K (future):
//     Business Settings (database "settings" table)
//     ↓ fallback
//     Environment variable
//     ↓ fallback
//     null (log warning, no notification)
//
//   Phase G (current):
//     Environment variable only
//
// When Phase K implements the Settings module, the top of this
// function gains a database lookup.  No other notification code
// needs to change.

function resolveBusinessRecipient(): string | null {
  // ---------------------------------------------------------------
  // Phase K: read `whatsapp_business_number` from the `settings`
  // table before the env-var fallback.
  //
  // Example:
  //   const db = getServiceRoleClient();
  //   const { data } = await db.from("settings")
  //     .select("value")
  //     .eq("key", "whatsapp_business_number")
  //     .maybeSingle();
  //   if (data?.value) return data.value;
  // ---------------------------------------------------------------

  const envNumber = process.env.BUSINESS_WHATSAPP_NUMBER;
  if (envNumber) return envNumber;

  console.warn(
    "[NotificationService] BUSINESS_WHATSAPP_NUMBER is not set. " +
      "Business notifications will be logged only.",
  );
  return null;
}

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

function sanitisePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry-friendly notification sender.
 *
 * Attempts up to 3 times with backoff delays.
 * Never throws — callers (actions) are not affected by failures.
 */
async function notify(to: string, body: string): Promise<void> {
  if (!isEnabled()) {
    console.log(
      "[NotificationService] WhatsApp disabled (WHATSAPP_ENABLED is not 'true').",
      { to, body },
    );
    return;
  }

  const provider = resolveWhatsAppProvider();
  if (!provider) {
    console.log("[NotificationService] No provider available — logged only.", {
      to,
      body,
    });
    return;
  }

  // Retry: 3 total attempts, with 2 s and 5 s delays between retries.
  const delays = [2000, 5000];
  let lastError: string | undefined = undefined;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const result = await provider.sendTextMessage(to, body);
      if (result.ok) {
        if (attempt > 0) {
          console.log("[NotificationService] Succeeded on retry.");
        }
        return;
      }
      lastError = result.error;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    // Wait before the next retry (skip after the last attempt)
    if (attempt < delays.length) {
      const delay = delays[attempt];
      console.log(
        `[NotificationService] Retry ${attempt + 1}/${delays.length} (${delay} ms delay)...`,
      );
      await sleep(delay!);
    }
  }

  console.error(
    "[NotificationService] All retries exhausted. Failure logged.",
    { lastError },
  );
}

// --------------------------------------------------------------------------
// Public API — the ONLY functions actions should import
// --------------------------------------------------------------------------

export type WhatsAppMessage = {
  to: string;
  body: string;
};

/** Generate a WhatsApp click-to-chat URL (admin UI quick-contact). */
export function waChatUrl(phone: string, body: string): string {
  const sanitised = sanitisePhone(phone);
  const encoded = encodeURIComponent(body);
  return `https://wa.me/${sanitised}?text=${encoded}`;
}

/**
 * Low-level send — kept for compatibility.
 *
 * Prefer the typed builders below for business events.
 */
export async function sendWhatsAppNotification(
  message: WhatsAppMessage,
): Promise<{ ok: boolean; error?: string }> {
  if (!message.to) {
    console.warn("[NotificationService] No recipient — skipped.");
    return { ok: false, error: "No recipient" };
  }
  try {
    await notify(message.to, message.body);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Notification failed",
    };
  }
}

// --------------------------------------------------------------------------
// Business-level notification helpers
// --------------------------------------------------------------------------
// Actions call these rather than composing messages manually.
// They handle the provider, recipient, and error isolation.

export async function notifyAdminNewQuotation(quote: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  event_type?: string | null;
  guest_count?: number | null;
  event_date?: string | null;
  notes?: string | null;
  quote_number?: string;
}): Promise<void> {
  const recipient = resolveBusinessRecipient();
  if (!recipient) return;
  const message = buildAdminQuotationAlert(quote);
  await notify(recipient, message);
}

export async function notifyCustomerQuotationStatus(quote: {
  quote_number: string;
  status: string;
  quoted_amount?: number | null;
  customer_phone: string;
}): Promise<void> {
  const message = buildCustomerQuotationMessage(quote);
  await notify(quote.customer_phone, message);
}

export async function notifyAdminNewOrder(order: {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  total: number;
  items_count: number;
}): Promise<void> {
  const recipient = resolveBusinessRecipient();
  if (!recipient) return;
  const message = buildAdminNewOrderAlert(order);
  await notify(recipient, message);
}

export async function notifyCustomerOrderConfirmed(order: {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  total: number;
  items_count: number;
}): Promise<void> {
  if (!order.customer_phone) return;
  const message = buildCustomerOrderConfirmation(order);
  await notify(order.customer_phone, message);
}

export async function notifyCustomerOrderReady(order: {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
}): Promise<void> {
  if (!order.customer_phone) return;
  const message = buildCustomerOrderReady({
    order_number: order.order_number,
    customer_name: order.customer_name,
  });
  await notify(order.customer_phone, message);
}
