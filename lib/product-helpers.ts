import type { ProductCardModel } from "components/chds";
import type { Product } from "lib/supabase/products";

/**
 * Convert a native Supabase Product to the CHDS ProductCard model.
 */
export function toProductCardModel(p: Product): ProductCardModel {
  // For variant products, show the cheapest variant price.
  // For simple products, show the product price.
  const cardPrice = p.hasVariants && p.variants.length > 0
    ? p.variants.reduce((min, v) =>
        Number(v.price.amount) < Number(min.amount) ? v.price : min,
      p.variants[0]!.price)
    : p.price;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
    price: cardPrice,
    isAvailable: p.isAvailable,
    preparationTimeMinutes: p.preparationTimeMinutes,
  };
}
