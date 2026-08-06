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
import { sendPushToAllAdmins } from "lib/push/send";
import { buildCustomerQuotationMessage } from "lib/services/whatsapp";

type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

type ActionResult =
  | {
      ok: true;
      quoteNumber: string;
      data: {
        customer_name: string;
        customer_phone: string;
        customer_email: string;
        event_type?: string;
        guest_count?: number;
        event_date?: string;
        notes?: string;
      };
    }
  | { ok: false; error: string };

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

    // Push notification to admin devices — must never block quotation creation
    try {
      await sendPushToAllAdmins({
        title: "New Quotation Request",
        body: `${customerName} — ${eventType ?? "General enquiry"}${guestCount ? ` (${guestCount} guests)` : ""}`,
        url: `/admin/quotations`,
        tag: `quotation:${quotation.quote_number}`,
      });
    } catch (pushError) {
      console.error("[Quotations] Push notification failed (non-blocking):", pushError);
    }

    revalidatePath("/admin/quotations");
    return {
      ok: true,
      quoteNumber: quotation.quote_number,
      data: {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        event_type: eventType,
        guest_count: guestCount,
        event_date: eventDate,
        notes,
      },
    };
  } catch (err) {
    console.error("Quotation submission error:", err);
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
): Promise<AdminActionResult> {
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
): Promise<AdminActionResult> {
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
