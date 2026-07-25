"use client";

import clsx from "clsx";
import Image from "next/image";
import { useMemo, useState } from "react";

export type ProductGalleryImage = {
  src: string;
  alt: string;
};

export function ProductImage({
  src,
  alt,
  className,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={clsx(
        "relative aspect-square w-full overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
        className,
      )}
    >
      <Image
        className="h-full w-full object-contain"
        fill
        sizes={sizes ?? "(min-width: 1024px) 66vw, 100vw"}
        alt={alt}
        src={src}
        priority={priority}
      />
    </div>
  );
}

export function ProductGallery({
  images,
  initialIndex = 0,
  className,
}: {
  images: ProductGalleryImage[];
  initialIndex?: number;
  className?: string;
}) {
  const safeInitial = Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1));
  const [index, setIndex] = useState(safeInitial);

  const current = images[index];
  const nextIndex = index + 1 < images.length ? index + 1 : 0;
  const prevIndex = index === 0 ? images.length - 1 : index - 1;

  const thumbs = useMemo(() => images.slice(0, 12), [images]);

  return (
    <div className={clsx("flex flex-col gap-[var(--ds-space-6)]", className)}>
      {current ? (
        <div className="relative">
          <ProductImage src={current.src} alt={current.alt} priority />
          {images.length > 1 ? (
            <div className="absolute bottom-[15%] flex w-full justify-center">
              <div className="mx-auto flex h-11 items-center rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]/80 text-[var(--ds-color-muted)] backdrop-blur-sm">
                <button
                  type="button"
                  aria-label="Previous product image"
                  onClick={() => setIndex(prevIndex)}
                  className="flex h-full items-center justify-center px-6 transition-all ease-in-out hover:scale-110 hover:text-[var(--ds-color-fg)]"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <div className="mx-1 h-6 w-px bg-[var(--ds-color-border)]" />
                <button
                  type="button"
                  aria-label="Next product image"
                  onClick={() => setIndex(nextIndex)}
                  className="flex h-full items-center justify-center px-6 transition-all ease-in-out hover:scale-110 hover:text-[var(--ds-color-fg)]"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {thumbs.length > 1 ? (
        <ul className="flex flex-wrap items-center justify-center gap-2 overflow-auto py-1 lg:mb-0">
          {thumbs.map((image, i) => {
            const isActive = i === index;
            return (
              <li key={`${image.src}-${i}`} className="h-20 w-20">
                <button
                  type="button"
                  aria-label="Select product image"
                  onClick={() => setIndex(i)}
                  className="h-full w-full"
                >
                  <div
                    className={clsx(
                      "relative h-full w-full overflow-hidden rounded-lg border bg-[var(--ds-color-surface)]",
                      isActive
                        ? "border-[var(--ds-color-accent)]"
                        : "border-[var(--ds-color-border)] hover:border-[var(--ds-color-accent)]",
                    )}
                  >
                    <Image
                      className="h-full w-full object-contain"
                      fill
                      sizes="80px"
                      alt={image.alt}
                      src={image.src}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

