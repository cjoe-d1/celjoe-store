"use client";

import clsx from "clsx";

export type VariantChoice = {
  id: string;
  name: string;
  isAvailable: boolean;
  stockQuantity: number;
};

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
  className,
}: {
  variants: VariantChoice[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (variants.length <= 1) return null;

  return (
    <div className={clsx(className)}>
      <div className="mb-4 text-sm uppercase tracking-wide text-[var(--ds-color-muted)]">
        Select an option
      </div>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const available = variant.isAvailable && variant.stockQuantity > 0;
          const active = variant.id === selectedId;

          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={active}
              aria-disabled={!available}
              disabled={!available}
              onClick={() => onSelect(variant.id)}
              title={
                available ? variant.name : variant.name + " (Out of stock)"
              }
              className={clsx(
                "flex min-w-[48px] items-center justify-center rounded-full border px-4 py-2 text-sm",

                {
                  "border-[var(--ds-color-accent)] bg-[var(--ds-color-surface)] text-[var(--ds-color-fg)] ring-2 ring-[var(--ds-color-accent)]":
                    active,
                  "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-fg)] transition duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:ring-[var(--ds-color-accent)]":
                    !active && available,
                  "cursor-not-allowed border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-muted)] line-through":
                    !available,
                },
              )}
            >
              {variant.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
