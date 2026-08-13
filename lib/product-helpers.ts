import type { ProductCardModel } from "components/chds";
import type { Product } from "lib/supabase/products";

/**
 * Convert a native Supabase Product to the CHDS ProductCard model.
 */
export function toProductCardModel(p: Product): ProductCardModel {
  // For variant products, show the cheapest AVAILABLE variant price so an
  // out-of-stock variant never sets the advertised "From" price.
  // For simple products, show the product price.
  const availableVariants = p.variants.filter((v) => v.isAvailable);

  const cardPrice =
    p.hasVariants && availableVariants.length > 0
      ? availableVariants.reduce(
          (min, v) =>
            Number(v.price.amount) < Number(min.amount) ? v.price : min,
          availableVariants[0]!.price,
        )
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
    hasVariants: p.hasVariants,
  };
}
