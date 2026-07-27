"use server";

import { revalidatePath } from "next/cache";
import { db, supabaseAdmin } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const PRODUCT_IMAGES_BUCKET = "product-images";
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Upload a product image to Supabase Storage and create a product_images row.
 * Accepts a base64-encoded file payload because Server Actions cannot
 * receive raw FormData file entries without a multipart/form-data wrapper.
 */
export async function uploadProductImageAction(
  productId: string,
  payload: {
    fileName: string;
    fileType: string;
    dataUrl: string; // "data:image/png;base64,...."
  },
): Promise<ActionResult<{ id: string; url: string; path: string }>> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (!productId) return { ok: false, error: "Missing product id." };
    if (!payload?.dataUrl) return { ok: false, error: "No file provided." };
    if (!ALLOWED_MIME.has(payload.fileType)) {
      return { ok: false, error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." };
    }

    // Parse the data URL
    const match = /^data:([^;]+);base64,(.+)$/.exec(payload.dataUrl);
    if (!match) return { ok: false, error: "Invalid file payload." };
    const mime = match[1];
    const base64 = match[2];
    if (!mime || !base64) return { ok: false, error: "Invalid file payload." };
    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength > MAX_BYTES) {
      return { ok: false, error: "File too large. Max 8 MB." };
    }
    if (!ALLOWED_MIME.has(mime)) {
      return { ok: false, error: "Unsupported file type." };
    }

    // Build a stable, collision-resistant path
    const ext = mime.split("/")[1] ?? "bin";
    const safeName = payload.fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(-40) || "image";
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType: mime,
        upsert: false,
      });
    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get the public URL
    const { data: pub } = supabaseAdmin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path);
    const url = pub?.publicUrl ?? path;

    // Determine the next display_order
    const { data: maxRow } = await db
      .from("product_images")
      .select("display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = Number((maxRow as { display_order?: number } | null)?.display_order ?? -1) + 1;

    // If this is the first image, make it the hero
    const { count } = await db
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);
    const isHero = !count || count === 0;

    const { data: inserted, error: insertError } = await db
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: url,
        path,
        alt_text: safeName.replace(/\.[^.]+$/, ""),
        is_hero: isHero,
        display_order: nextOrder,
        uploaded_by: session.userId,
      })
      .select("id")
      .single();
    if (insertError) {
      // Roll back the storage upload so we don't leave orphans
      await supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
      return { ok: false, error: insertError.message };
    }

    await logAudit(
      auditFromSession(session, "product.image.upload", "product_images", inserted?.id ?? null, {
        productId, path, mime, bytes: buffer.byteLength,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    return { ok: true, data: { id: String(inserted?.id), url, path } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to upload image.",
    };
  }
}

/**
 * Delete a product image (Storage object + DB row).
 */
export async function deleteProductImageAction(
  imageId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (!imageId) return { ok: false, error: "Missing image id." };

    const { data: row, error: fetchError } = await db
      .from("product_images")
      .select("id, product_id, path")
      .eq("id", imageId)
      .maybeSingle();
    if (fetchError) return { ok: false, error: fetchError.message };
    if (!row) return { ok: false, error: "Image not found." };

    const r = row as { id: string; product_id: string; path: string };

    // Remove from Storage (best-effort; ignore 404s)
    try {
      await supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).remove([r.path]);
    } catch {
      // ignore
    }

    const { error: delError } = await db
      .from("product_images")
      .delete()
      .eq("id", imageId);
    if (delError) return { ok: false, error: delError.message };

    // If we deleted the hero, promote the first remaining image
    const { data: next } = await db
      .from("product_images")
      .select("id")
      .eq("product_id", r.product_id)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await db
        .from("product_images")
        .update({ is_hero: true })
        .eq("id", (next as { id: string }).id);
    }

    await logAudit(
      auditFromSession(session, "product.image.delete", "product_images", imageId, {
        productId: r.product_id, path: r.path,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/products/${r.product_id}`);
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete image.",
    };
  }
}

/**
 * Persist a new ordering for a product's images.
 * Accepts an array of image IDs in the desired order.
 */
export async function reorderProductImagesAction(
  productId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (!productId) return { ok: false, error: "Missing product id." };
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return { ok: false, error: "No image ids provided." };
    }

    // Update each row to its new display_order in a single transaction
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const { error } = await db
        .from("product_images")
        .update({ display_order: i })
        .eq("id", id)
        .eq("product_id", productId);
      if (error) return { ok: false, error: error.message };
    }

    await logAudit(
      auditFromSession(session, "product.image.reorder", "product_images", productId, {
        orderedIds,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/products/${productId}`);
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reorder images.",
    };
  }
}

/**
 * Mark a specific image as the hero (and clear hero on the others).
 */
export async function setHeroProductImageAction(
  imageId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { ip, userAgent } = await getClientMetadata();

    if (!imageId) return { ok: false, error: "Missing image id." };

    const { data: row, error: fetchError } = await db
      .from("product_images")
      .select("id, product_id")
      .eq("id", imageId)
      .maybeSingle();
    if (fetchError) return { ok: false, error: fetchError.message };
    if (!row) return { ok: false, error: "Image not found." };
    const r = row as { id: string; product_id: string };

    // Clear hero on siblings
    await db
      .from("product_images")
      .update({ is_hero: false })
      .eq("product_id", r.product_id);

    // Set this one as hero
    const { error: setError } = await db
      .from("product_images")
      .update({ is_hero: true })
      .eq("id", imageId);
    if (setError) return { ok: false, error: setError.message };

    await logAudit(
      auditFromSession(session, "product.image.set_hero", "product_images", imageId, {
        productId: r.product_id,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/products/${r.product_id}`);
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to set hero image.",
    };
  }
}
