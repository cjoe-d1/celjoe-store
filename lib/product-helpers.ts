import type { ProductCardModel } from "components/chds";
import type { Product } from "lib/supabase/products";

/**
 * Convert a native Supabase Product to the CHDS ProductCard model.
 */
export function toProductCardModel(p: Product): ProductCardModel {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
    price: p.price,
    isAvailable: p.isAvailable,
    preparationTimeMinutes: p.preparationTimeMinutes,
  };
}
