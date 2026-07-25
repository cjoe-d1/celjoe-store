"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";

export function Toggle({
  checked,
  onCheckedChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={clsx(
        "relative inline-flex h-7 w-12 items-center rounded-full border transition-[background-color,border-color] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        checked
          ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)]"
          : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "inline-block h-5 w-5 rounded-full bg-[var(--ds-color-bg)] shadow-[var(--ds-shadow-sm)] transition-transform duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  inputMode = "numeric",
  autoFocus,
  disabled,
  className,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const clean = value.replace(/\s+/g, "").slice(0, length);
    return Array.from({ length }, (_, i) => clean[i] ?? "");
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (index: number, nextDigit: string) => {
    const next = digits.slice();
    next[index] = nextDigit;
    onChange(next.join(""));
  };

  const focusIndex = (index: number) => {
    const bounded = Math.max(0, Math.min(length - 1, index));
    inputs.current[bounded]?.focus();
    inputs.current[bounded]?.select();
  };

  return (
    <div className={clsx("flex items-center gap-[var(--ds-space-2)]", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          value={digit}
          disabled={disabled}
          inputMode={inputMode}
          autoComplete="one-time-code"
          maxLength={1}
          onChange={(e) => {
            const nextDigit = e.target.value.replace(/[^0-9a-z]/gi, "").slice(-1);
            setAt(index, nextDigit);
            if (nextDigit) focusIndex(index + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit) {
              focusIndex(index - 1);
              return;
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              focusIndex(index - 1);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              focusIndex(index + 1);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\s+/g, "")
              .replace(/[^0-9a-z]/gi, "")
              .slice(0, length - index);

            if (!pasted) return;

            const next = digits.slice();
            for (let i = 0; i < pasted.length; i += 1) {
              next[index + i] = pasted[i] ?? "";
            }
            onChange(next.join(""));
            focusIndex(index + pasted.length);
          }}
          className={clsx(
            "h-11 w-10 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] shadow-[var(--ds-shadow-sm)]",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)] focus-visible:border-[var(--ds-color-accent)]",
            disabled ? "opacity-50" : "",
          )}
        />
      ))}
    </div>
  );
}

