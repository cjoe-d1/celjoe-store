"use client";

import clsx from "clsx";

export type VariantOption = {
  name: string;
  value: string;
};

export type VariantModel = {
  id: string;
  isAvailable: boolean;
  optionValues: VariantOption[];
};

export type OptionGroup = {
  name: string;
  values: string[];
};

export function VariantSelector({
  optionGroups,
  variants,
  value,
  onChange,
  className,
}: {
  optionGroups: OptionGroup[];
  variants: VariantModel[];
  value: Record<string, string | undefined>;
  onChange: (next: Record<string, string | undefined>) => void;
  className?: string;
}) {
  const normalizedGroups = optionGroups.map((g) => ({
    ...g,
    key: g.name.toLowerCase(),
  }));

  const isAllowedValue = (key: string, v: string) =>
    normalizedGroups.some((g) => g.key === key && g.values.includes(v));

  const isCombinationAvailable = (next: Record<string, string | undefined>) =>
    variants.some((variant) => {
      if (!variant.isAvailable) return false;
      return variant.optionValues.every((opt) => {
        const k = opt.name.toLowerCase();
        const selected = next[k];
        return selected ? selected === opt.value : true;
      });
    });

  const setOption = (key: string, nextValue: string) => {
    const next: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v && isAllowedValue(k, v)) next[k] = v;
    }
    next[key] = nextValue;
    onChange(next);
  };

  const hasNoOptionsOrJustOneOption =
    optionGroups.length === 0 ||
    (optionGroups.length === 1 && optionGroups[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) return null;

  return (
    <div className={clsx(className)}>
      {normalizedGroups.map((group) => (
        <div key={group.key} className="mb-8">
          <div className="mb-4 text-sm uppercase tracking-wide">{group.name}</div>
          <div className="flex flex-wrap gap-3">
            {group.values.map((v) => {
              const next = { ...value, [group.key]: v };
              const available = isCombinationAvailable(next);
              const active = value[group.key] === v;

              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active}
                  aria-disabled={!available}
                  disabled={!available}
                  onClick={() => setOption(group.key, v)}
                  title={`${group.name} ${v}${!available ? " (Out of Stock)" : ""}`}
                  className={clsx(
                    "flex min-w-[48px] items-center justify-center rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-2 py-1 text-sm text-[var(--ds-color-fg)]",
                    {
                      "cursor-default ring-2 ring-[var(--ds-color-accent)]": active,
                      "ring-1 ring-transparent transition duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:ring-[var(--ds-color-accent)]":
                        !active && available,
                      "relative z-10 cursor-not-allowed overflow-hidden bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-muted)] ring-1 ring-[var(--ds-color-border)] before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-[var(--ds-color-border)] before:transition-transform":
                        !available,
                    },
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

