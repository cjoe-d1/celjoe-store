"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
import { sendPushToAllAdmins } from "lib/push/send";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveBusinessProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "business_profile",
          value: {
            brand_name: String(formData.get("brand_name") ?? ""),
            company_name: String(formData.get("company_name") ?? ""),
            tagline: String(formData.get("tagline") ?? ""),
            contact_email: String(formData.get("contact_email") ?? ""),
            contact_phone: String(formData.get("contact_phone") ?? ""),
            address: String(formData.get("address") ?? ""),
            city: String(formData.get("city") ?? ""),
            state: String(formData.get("state") ?? ""),
            country: String(formData.get("country") ?? "Nigeria"),
            registration_number: String(formData.get("registration_number") ?? ""),
            tax_id: String(formData.get("tax_id") ?? ""),
          },
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_business_profile", "settings", null, null, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save business profile." };
  }
}

export async function saveOpeningHoursAction(hours: Record<string, { open: string; close: string; closed: boolean }>): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "opening_hours",
          value: hours,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_opening_hours", "settings", null, hours, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save opening hours." };
  }
}

export async function saveTaxesAction(input: {
  vatRate: number;
  serviceChargeRate: number;
  inclusive: boolean;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "taxes",
          value: input,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_taxes", "settings", null, input, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save taxes." };
  }
}

export async function saveDeliverySettingsAction(input: {
  baseFee: number;
  perKmFee: number;
  freeDeliveryThreshold: number;
  minOrder: number;
  maxRadiusKm: number;
  zones: Array<{ name: string; fee: number }>;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "delivery",
          value: input,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_delivery", "settings", null, input, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save delivery settings." };
  }
}

export async function savePaymentSettingsAction(input: {
  acceptedMethods: string[];
  paystackPublicKey: string;
  defaultCurrency: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    // SECURITY: Never store secret keys in the settings table.
    // Secret keys (PAYSTACK_SECRET_KEY, Supabase service role, VAPID private key, etc.)
    // MUST remain server-side environment variables only.
    const value = {
      acceptedMethods: input.acceptedMethods,
      paystackPublicKey: input.paystackPublicKey,
      defaultCurrency: input.defaultCurrency,
    };

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "payments",
          value,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_payments", "settings", null, {
        methods: input.acceptedMethods,
      }, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save payment settings." };
  }
}

export async function saveBrandingAction(input: {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "branding",
          value: input,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_branding", "settings", null, input, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save branding." };
  }
}

export async function saveNotificationsAction(input: {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  orderConfirmation: boolean;
  orderReady: boolean;
  orderDelivered: boolean;
  marketingEmail: boolean;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "notifications",
          value: input,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_notifications", "settings", null, input, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save notifications." };
  }
}

export async function saveSecuritySettingsAction(input: {
  sessionMaxHours: number;
  requireMfa: boolean;
  passwordMinLength: number;
  ipAllowlist: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("settings")
      .upsert(
        {
          key: "security",
          value: input,
          updated_at: new Date().toISOString(),
          updated_by: session.userId,
        },
        { onConflict: "key" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "settings.update_security", "settings", null, input, ip, userAgent),
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save security settings." };
  }
}

/**
 * SECURITY: API keys MUST NOT be stored in the settings table.
 *
 * Secret keys (PAYSTACK_SECRET_KEY, SendGrid, Twilio, etc.) are
 * configured via environment variables on the deployment platform.
 * Storing them in the database exposes them to any admin client
 * that reads the settings table via the anon key.
 *
 * This action now returns an error explaining the correct approach.
 */
export async function saveApiKeyAction(
  provider: string,
  key: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const { ip, userAgent } = await getClientMetadata();

  await logAudit(
    auditFromSession(session, "settings.api_key_rejected", "settings", provider, null, ip, userAgent),
  );

  return {
    ok: false,
    error: `API keys are configured via environment variables, not through the admin panel. Set the ${provider.toUpperCase()} key on your deployment platform.`,
  };
}

// --------------------------------------------------------------------------
// Admin push notification test
// --------------------------------------------------------------------------

/**
 * Send a test push notification to all admin devices.
 *
 * This is an admin-only diagnostic action. It verifies the
 * complete push pipeline: VAPID config → subscription retrieval →
 * web-push dispatch → push service → service worker → notification.
 */
export async function sendTestPushAction(): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    await sendPushToAllAdmins({
      title: "CELJOE Grills & Juicebar",
      body: "Test notification — push is working correctly.",
      url: "/admin",
      tag: "test",
    });

    await logAudit(
      auditFromSession(session, "admin.push_test", "push_subscriptions", null, null, ip, userAgent),
    );

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Push test failed.",
    };
  }
}
