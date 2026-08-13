import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { AvailabilityBadge, PreparationTime, PriceDisplay } from "./product";

export type ProductCardModel = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  price: { amount: string; currencyCode: string };
  isAvailable: boolean;
  preparationTimeMinutes?: number | null;
  hasVariants?: boolean;
};

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardModel;
  className?: string;
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className={clsx(
        "group flex h-full flex-col overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)] transition-[box-shadow,transform] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:shadow-[var(--ds-shadow-md)]",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--ds-color-surface-muted)]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-[var(--ds-duration-slow)] ease-[var(--ds-ease-decelerate)] group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="absolute left-[var(--ds-space-3)] top-[var(--ds-space-3)] flex flex-col gap-2">
          {!product.isAvailable && <AvailabilityBadge available={false} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-[var(--ds-space-5)]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="line-clamp-2 text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              {product.shortDescription}
            </p>
          )}
        </div>
        <div className="mt-auto pt-[var(--ds-space-4)] flex items-center justify-between">
          <span className="flex flex-col items-start gap-[var(--ds-space-1)]">
            {product.hasVariants && (
              <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Multiple options
              </span>
            )}
            <span>
              {product.hasVariants && (
                <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)] font-[var(--ds-font-weight-normal)]">
                  From{" "}
                </span>
              )}
              <PriceDisplay
                amount={product.price.amount}
                currencyCode={product.price.currencyCode}
              />
            </span>
          </span>
          {product.preparationTimeMinutes ? (
            <PreparationTime minutes={product.preparationTimeMinutes} />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
