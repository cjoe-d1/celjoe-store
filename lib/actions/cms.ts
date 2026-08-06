"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
type ActionResult = { ok: true } | { ok: false; error: string };

export async function createTestimonialAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("testimonials").insert({
      author_name: String(formData.get("author_name") ?? "").trim(),
      author_role: String(formData.get("author_role") ?? "") || null,
      body: String(formData.get("body") ?? "").trim(),
      rating: Number(formData.get("rating") ?? 5),
      image_url: String(formData.get("image_url") ?? "") || null,
      is_published: formData.get("is_published") === "on",
      created_by: session.userId,
    });

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "testimonial.create", "testimonials", null, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/testimonials");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create testimonial." };
  }
}

export async function updateTestimonialAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("testimonials")
      .update({
        author_name: String(formData.get("author_name") ?? "").trim(),
        author_role: String(formData.get("author_role") ?? "") || null,
        body: String(formData.get("body") ?? "").trim(),
        rating: Number(formData.get("rating") ?? 5),
        image_url: String(formData.get("image_url") ?? "") || null,
        is_published: formData.get("is_published") === "on",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "testimonial.update", "testimonials", id, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/testimonials");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update testimonial." };
  }
}

export async function deleteTestimonialAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("testimonials")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "testimonial.delete", "testimonials", id, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/testimonials");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete testimonial." };
  }
}

export async function saveNavigationAction(
  location: "header" | "footer",
  items: Array<{ label: string; href: string; position: number }>,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("navigation")
      .upsert(
        { location, items, updated_at: new Date().toISOString() },
        { onConflict: "location" },
      );

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "navigation.save", "navigation", location, {
        count: items.length,
      }, ip, userAgent),
    );

    revalidatePath("/admin/cms/navigation");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save navigation." };
  }
}

export async function createPromotionAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("promotions").insert({
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      code: String(formData.get("code") ?? "") || null,
      discount_type: String(formData.get("discount_type") ?? "percentage"),
      discount_value: Number(formData.get("discount_value") ?? 0),
      starts_at: String(formData.get("starts_at") ?? "") || null,
      ends_at: String(formData.get("ends_at") ?? "") || null,
      is_active: formData.get("is_active") === "on",
      created_by: session.userId,
    });

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "promotion.create", "promotions", null, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/promotions");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create promotion." };
  }
}

export async function togglePromotionAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("promotions")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "promotion.toggle", "promotions", id, { isActive }, ip, userAgent),
    );

    revalidatePath("/admin/cms/promotions");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update promotion." };
  }
}

export async function deletePromotionAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("promotions")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "promotion.delete", "promotions", id, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/promotions");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete promotion." };
  }
}

export async function createCmsPageAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    if (!slug) return { ok: false, error: "Page slug required." };

    const { error } = await db.from("cms_pages").insert({
      slug,
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      seo_title: String(formData.get("seo_title") ?? "") || null,
      seo_description: String(formData.get("seo_description") ?? "") || null,
      is_published: formData.get("is_published") === "on",
      created_by: session.userId,
    });

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms_page.create", "cms_pages", null, { slug }, ip, userAgent),
    );

    revalidatePath("/admin/cms/pages");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create page." };
  }
}

export async function updateCmsPageAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("cms_pages")
      .update({
        title: String(formData.get("title") ?? "").trim(),
        body: String(formData.get("body") ?? "").trim(),
        seo_title: String(formData.get("seo_title") ?? "") || null,
        seo_description: String(formData.get("seo_description") ?? "") || null,
        is_published: formData.get("is_published") === "on",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms_page.update", "cms_pages", id, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/pages");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update page." };
  }
}

export async function deleteCmsPageAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("cms_pages")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms_page.delete", "cms_pages", id, null, ip, userAgent),
    );

    revalidatePath("/admin/cms/pages");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete page." };
  }
}
