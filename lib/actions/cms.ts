"use server";

import { revalidatePath } from "next/cache";
import { db } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
import type { CmsSurface } from "lib/supabase/admin/cms";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveCmsSurfaceAction(
  surface: CmsSurface,
  payload: {
    title: string;
    subtitle: string;
    body: string;
    heroImageUrl: string;
    visibility: "draft" | "published";
    scheduledFor: string | null;
    seoTitle: string;
    seoDescription: string;
    sections: unknown[];
  },
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data: existing } = await db.from("cms_surfaces")
      .select("id, version")
      .eq("surface", surface)
      .maybeSingle();

    const existingRow = existing as { id?: string; version?: number } | null;
    const nextVersion = Number(existingRow?.version ?? 0) + 1;

    if (existingRow) {
      // cms_versions is a runtime table; cast payload because the typed client
      // does not yet know about Phase 10 additive tables.
      await db.from("cms_versions").insert({
        surface,
        version: nextVersion - 1,
        title: payload.title,
        body: payload.body,
        payload: { ...payload },
        archived_by: session.userId,
      });
    }

    const upsertPayload = {
      surface,
      title: payload.title,
      subtitle: payload.subtitle,
      body: payload.body,
      hero_image_url: payload.heroImageUrl || null,
      visibility: payload.visibility,
      scheduled_for: payload.scheduledFor || null,
      seo_title: payload.seoTitle || null,
      seo_description: payload.seoDescription || null,
      sections: payload.sections,
      version: nextVersion,
      updated_at: new Date().toISOString(),
      published_at:
        payload.visibility === "published" ? new Date().toISOString() : null,
      updated_by: session.userId,
    };

    const { error } = await (db.from("cms_surfaces") as any)
      .upsert(upsertPayload, { onConflict: "surface" });

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms.save_surface", "cms_surfaces", surface, {
        version: nextVersion,
        visibility: payload.visibility,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/cms/${surface}`);
    revalidatePath("/admin/cms");
    if (surface === "homepage") revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save CMS content." };
  }
}

export async function publishCmsSurfaceAction(surface: CmsSurface): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("cms_surfaces")
      .update({
        visibility: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("surface", surface);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms.publish", "cms_surfaces", surface, null, ip, userAgent),
    );

    revalidatePath(`/admin/cms/${surface}`);
    if (surface === "homepage") revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to publish." };
  }
}

export async function unpublishCmsSurfaceAction(surface: CmsSurface): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { error } = await db.from("cms_surfaces")
      .update({
        visibility: "draft",
        published_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("surface", surface);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms.unpublish", "cms_surfaces", surface, null, ip, userAgent),
    );

    revalidatePath(`/admin/cms/${surface}`);
    if (surface === "homepage") revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to unpublish." };
  }
}

export async function restoreCmsVersionAction(
  surface: CmsSurface,
  version: number,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data: history, error: fetchError } = await db.from("cms_versions")
      .select("payload")
      .eq("surface", surface)
      .eq("version", version)
      .maybeSingle();

    if (fetchError || !history) return { ok: false, error: "Version not found." };

    const payload = history.payload as Record<string, unknown>;
    const { error } = await db.from("cms_surfaces")
      .update({
        title: payload.title as string,
        subtitle: payload.subtitle as string,
        body: payload.body as string,
        hero_image_url: (payload.heroImageUrl as string) || null,
        visibility: (payload.visibility as string) || "draft",
        seo_title: (payload.seoTitle as string) || null,
        seo_description: (payload.seoDescription as string) || null,
        sections: payload.sections,
        updated_at: new Date().toISOString(),
        updated_by: session.userId,
      })
      .eq("surface", surface);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms.restore_version", "cms_surfaces", surface, {
        version,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/cms/${surface}`);
    if (surface === "homepage") revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to restore version." };
  }
}

export async function reorderCmsSectionsAction(
  surface: CmsSurface,
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    const { data: current, error: fetchError } = await db.from("cms_surfaces")
      .select("sections")
      .eq("surface", surface)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };

    const sections = (current?.sections as Array<{ id: string }>) ?? [];
    const ordered = orderedIds
      .map((id, index) => {
        const section = sections.find((s) => s.id === id);
        return section ? { ...section, position: index } : null;
      })
      .filter(Boolean) as Array<{ id: string; position: number }>;

    const { error } = await db.from("cms_surfaces")
      .update({ sections: ordered, updated_at: new Date().toISOString() })
      .eq("surface", surface);

    if (error) return { ok: false, error: error.message };

    await logAudit(
      auditFromSession(session, "cms.reorder_sections", "cms_surfaces", surface, {
        orderedIds,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/cms/${surface}`);
    if (surface === "homepage") revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reorder sections." };
  }
}

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
