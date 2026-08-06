import Image from "next/image";
import { Label } from "components/chds";
import type { ReactNode } from "react";

export interface FeatureCard {
  title: string;
  description?: string;
  image?: string | null;
}

/** A grid of labeled feature cards (e.g. event categories, values). */
export function FeatureGrid({
  items,
  label,
  columns = 3,
}: {
  items: readonly FeatureCard[];
  label?: string;
  columns?: 2 | 3 | 4;
}) {
  if (!items.length) return null;

  const cols =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`mt-[var(--ds-space-8)] grid ${cols} gap-[var(--ds-space-4)]`}>
      {items.map((item) => (
        <article
          key={item.title}
          className="flex flex-col overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] transition-[box-shadow] duration-[var(--ds-duration-base)] hover:shadow-[var(--ds-shadow-md)]"
        >
          {item.image ? (
            <div className="relative aspect-[3/2] w-full">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-[var(--ds-space-3)] p-[var(--ds-space-6)]">
            {label ? <Label tone="muted">{label}</Label> : null}
            <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
              {item.title}
            </h3>
            {item.description ? (
              <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                {item.description}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

/** A grid of cards with custom children per item. */
export function CardGrid({
  items,
  columns = 3,
  children,
}: {
  items: unknown[];
  columns?: 2 | 3 | 4;
  children: (item: unknown, index: number) => ReactNode;
}) {
  if (!items.length) return null;

  const cols =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${cols} gap-[var(--ds-space-6)]`}>
      {items.map((item, i) => (
        <div key={i}>{children(item, i)}</div>
      ))}
    </div>
  );
}
