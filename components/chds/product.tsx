import clsx from "clsx";

export function PriceDisplay({
  amount,
  currencyCode,
  className,
}: {
  amount: string;
  currencyCode: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full bg-[var(--ds-color-accent)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-white",
        className,
      )}
    >
      <span>
        {new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: currencyCode,
          currencyDisplay: "narrowSymbol",
        }).format(parseFloat(amount))}
      </span>
    </div>
  );
}

export function PreparationTime({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]",
        className,
      )}
    >
      {minutes} min
    </div>
  );
}

export function AvailabilityBadge({
  available,
  className,
}: {
  available: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-[var(--ds-space-3)] py-[var(--ds-space-1)] text-[length:var(--ds-text-label)] uppercase tracking-wide",
        available
          ? "border-[var(--ds-color-success)]/30 bg-[var(--ds-color-success)]/10 text-[var(--ds-color-fg)]"
          : "border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 text-[var(--ds-color-fg)]",
        className,
      )}
    >
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const canDecrease = value > min;
  const canIncrease = max === undefined ? true : value < max;

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
        disabled ? "opacity-50" : "",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled || !canDecrease}
        onClick={() => onChange(value - 1)}
        className={clsx(
          "h-10 w-10 rounded-full text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
          disabled || !canDecrease ? "cursor-not-allowed opacity-50" : "",
        )}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <div className="min-w-10 text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
        {value}
      </div>
      <button
        type="button"
        disabled={disabled || !canIncrease}
        onClick={() => onChange(value + 1)}
        className={clsx(
          "h-10 w-10 rounded-full text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
          disabled || !canIncrease ? "cursor-not-allowed opacity-50" : "",
        )}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

