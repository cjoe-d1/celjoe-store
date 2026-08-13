"use server";

import { revalidatePath } from "next/cache";
import { db, supabaseAdmin } from "lib/supabase/admin";
import { requireAdmin } from "lib/auth/guards";
import { getClientMetadata } from "lib/auth/session";
import { logAudit, auditFromSession } from "lib/auth/audit";
import {
  buildPublicId,
  buildDeliveryUrl,
  uploadImageToCloudinary,
  destroyImage,
  isCloudinaryPublicId,
} from "lib/cloudinary";

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
const MAX_BYTES = 7 * 1024 * 1024; // 7 MB

/**
 * Upload a product image to Cloudinary and create a product_images row.
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
      return { ok: false, error: "File too large. Max 7 MB." };
    }
    if (!ALLOWED_MIME.has(mime)) {
      return { ok: false, error: "Unsupported file type." };
    }

    // Build a collision-resistant Cloudinary public_id (also the delete identifier)
    const safeName = payload.fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(-40) || "image";
    const publicId = buildPublicId(productId);

    // Upload to Cloudinary (server-side)
    let uploaded: { secureUrl: string; publicId: string };
    try {
      uploaded = await uploadImageToCloudinary({ buffer, publicId });
    } catch (err) {
      return {
        ok: false,
        error: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`,
      };
    }

    // Secure, auto-optimized delivery URL
    const url = buildDeliveryUrl(uploaded.publicId);

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
        path: uploaded.publicId,
        alt_text: safeName.replace(/\.[^.]+$/, ""),
        is_hero: isHero,
        display_order: nextOrder,
        uploaded_by: session.userId,
      })
      .select("id")
      .single();
    if (insertError) {
      // Roll back the Cloudinary upload so we don't leave orphans
      try {
        await destroyImage(uploaded.publicId);
      } catch {
        // best-effort rollback
      }
      return { ok: false, error: insertError.message };
    }

    await logAudit(
      auditFromSession(session, "product.image.upload", "product_images", inserted?.id ?? null, {
        productId, path: uploaded.publicId, mime, bytes: buffer.byteLength,
      }, ip, userAgent),
    );

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    return { ok: true, data: { id: String(inserted?.id), url, path: uploaded.publicId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to upload image.",
    };
  }
}

/**
 * Delete a product image (physical asset + DB row).
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

    // Remove the physical asset from the correct provider (best-effort; ignore 404s).
    try {
      if (isCloudinaryPublicId(r.path)) {
        await destroyImage(r.path);
      } else {
        await supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).remove([r.path]);
      }
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
