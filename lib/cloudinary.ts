import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { requireEnv } from "config/env";

let configured = false;

function configure(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: requireEnv.cloudinaryCloudName(),
    api_key: requireEnv.cloudinaryApiKey(),
    api_secret: requireEnv.cloudinaryApiSecret(),
    secure: true,
  });
  configured = true;
}

/**
 * Prefix for Cloudinary public IDs. Also the discriminator that lets the
 * delete action tell Cloudinary public IDs apart from Supabase storage paths.
 */
export const CLOUDINARY_PUBLIC_ID_PREFIX = "celjoe/products/";

/** Collision-resistant public_id scoped to a product. */
export function buildPublicId(productId: string): string {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${CLOUDINARY_PUBLIC_ID_PREFIX}${productId}/${unique}`;
}

/**
 * Secure, auto-optimized (f_auto, q_auto) delivery URL.
 *
 * Built manually (rather than via `cloudinary.url`) so we never emit the
 * `_a` signature query param the SDK appends for this account. Public IDs are
 * guaranteed URL-safe by `buildPublicId`, and images are public by default.
 */
export function buildDeliveryUrl(publicId: string): string {
  const cloudName = requireEnv.cloudinaryCloudName();
  const encodedPath = publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${encodedPath}`;
}

type UploadedImage = { secureUrl: string; publicId: string };

/** Server-side upload of an image buffer to Cloudinary. */
export async function uploadImageToCloudinary(params: {
  buffer: Buffer;
  publicId: string;
}): Promise<UploadedImage> {
  configure();
  const { buffer, publicId } = params;

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", public_id: publicId },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id) {
            return reject(new Error("Cloudinary upload returned no result."));
          }
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        },
      );
      stream.end(buffer);
    },
  );

  return { secureUrl: result.secure_url, publicId: result.public_id };
}

/** Destroy a Cloudinary image by public_id. */
export async function destroyImage(publicId: string): Promise<void> {
  configure();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

/** True when `path` holds a Cloudinary public_id rather than a Supabase storage path. */
export function isCloudinaryPublicId(path: string): boolean {
  return typeof path === "string" && path.startsWith(CLOUDINARY_PUBLIC_ID_PREFIX);
}
