"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
import { createQuotation } from "lib/supabase/quotations";
import {
  updateQuotation,
  type QuotationStatus,
} from "lib/supabase/admin/quotations";
import {
  sendWhatsAppNotification,
  buildAdminQuotationAlert,
  buildCustomerQuotationMessage,
} from "lib/services/whatsapp";

type ActionResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Customer-facing: submit a quotation request (no auth required)
// ---------------------------------------------------------------------------

export async function submitQuotationAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const customerName = String(formData.get("name") ?? "").trim();
    const customerEmail = String(formData.get("email") ?? "").trim();
    const customerPhone = String(formData.get("phone") ?? "").trim();
    const eventType = String(formData.get("event_type") ?? "").trim() || undefined;
    const guestCountRaw = String(formData.get("guests") ?? "").trim();
    const eventDate = String(formData.get("event_date") ?? "").trim() || undefined;
    const notes = String(formData.get("notes") ?? "").trim() || undefined;

    if (!customerName || !customerEmail || !customerPhone) {
      return { ok: false, error: "Name, email, and phone are required." };
    }

    const guestCount = guestCountRaw ? parseInt(guestCountRaw, 10) : undefined;
    if (guestCount !== undefined && (isNaN(guestCount) || guestCount < 1)) {
      return { ok: false, error: "Guest count must be at least 1." };
    }

    const quotation = await createQuotation({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      event_type: eventType,
      guest_count: guestCount,
      event_date: eventDate,
      notes,
    });

    // Notify admin via WhatsApp (graceful — works if Twilio or wa.me configured)
    await sendWhatsAppNotification({
      to: customerPhone,
      body: buildAdminQuotationAlert({
        quote_number: quotation.quote_number,
        customer_name: quotation.customer_name,
        customer_phone: quotation.customer_phone,
        event_type: quotation.event_type,
        guest_count: quotation.guest_count,
        event_date: quotation.event_date,
      }),
    });

    revalidatePath("/admin/quotations");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit quotation.",
    };
  }
}

// ---------------------------------------------------------------------------
// Admin: update quotation status
// ---------------------------------------------------------------------------

export async function updateQuotationStatusAction(
  id: string,
  status: QuotationStatus,
  quotedAmount?: number | null,
  adminNotes?: string | null,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const quotation = await updateQuotation(id, {
      status,
      quoted_amount: quotedAmount ?? undefined,
      admin_notes: adminNotes ?? undefined,
      updated_by: session.userId,
    });

    await logAudit(
      auditFromSession(
        session,
        `quotation.update_status`,
        "quotations",
        id,
        { status, quoted_amount: quotedAmount },
        ip,
        userAgent,
      ),
    );

    // Notify customer if status changed to "quoted" or "accepted"
    if (status === "quoted" || status === "accepted") {
      await sendWhatsAppNotification({
        to: quotation.customer_phone,
        body: buildCustomerQuotationMessage({
          quote_number: quotation.quote_number,
          status,
          quoted_amount: quotation.quoted_amount,
        }),
      });
    }

    revalidatePath("/admin/quotations");
    revalidatePath(`/admin/quotations/${id}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update quotation.",
    };
  }
}

// ---------------------------------------------------------------------------
// Admin: update admin notes
// ---------------------------------------------------------------------------

export async function updateQuotationNotesAction(
  id: string,
  adminNotes: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    await updateQuotation(id, {
      admin_notes: adminNotes,
      updated_by: session.userId,
    });

    await logAudit(
      auditFromSession(
        session,
        "quotation.update_notes",
        "quotations",
        id,
        null,
        ip,
        userAgent,
      ),
    );

    revalidatePath(`/admin/quotations/${id}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update notes.",
    };
  }
}
