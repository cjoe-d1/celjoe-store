import clsx from "clsx";
import { forwardRef } from "react";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-[var(--ds-space-2)]", className)}>
      {label ? (
        <label className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-danger)]">
          {error}
        </div>
      ) : hint ? (
        <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("flex flex-col gap-[var(--ds-space-4)]", className)}>
      <div className="flex flex-col gap-[var(--ds-space-1)]">
        <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
          {title}
        </div>
        {description ? (
          <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {description}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-[var(--ds-space-4)]">{children}</div>
    </section>
  );
}

export function ValidationMessage({
  children,
  tone = "error",
  className,
}: {
  children: React.ReactNode;
  tone?: "error" | "hint";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "text-[length:var(--ds-text-caption)]",
        tone === "error"
          ? "text-[var(--ds-color-danger)]"
          : "text-[var(--ds-color-muted)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const controlBase =
  "w-full rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] placeholder:text-[var(--ds-color-muted)] transition-[border-color,box-shadow] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]";

const controlFocus =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)] focus-visible:border-[var(--ds-color-accent)]";

const controlDisabled = "disabled:opacity-50 disabled:cursor-not-allowed";

export const TextInput = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  function TextInput({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={clsx(controlBase, controlFocus, controlDisabled, className)}
        {...props}
      />
    );
  },
);

export const EmailInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type">
>(function EmailInput({ ...props }, ref) {
  return <TextInput ref={ref} type="email" autoComplete="email" {...props} />;
});

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type">
>(function PasswordInput({ ...props }, ref) {
  return (
    <TextInput ref={ref} type="password" autoComplete="current-password" {...props} />
  );
});

export const PhoneInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type" | "inputMode">
>(function PhoneInput({ ...props }, ref) {
  return <TextInput ref={ref} type="tel" inputMode="tel" autoComplete="tel" {...props} />;
});

export const CurrencyInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type" | "inputMode">
>(function CurrencyInput({ ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...props}
    />
  );
});

export const DateInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type">
>(function DateInput({ ...props }, ref) {
  return <TextInput ref={ref} type="date" {...props} />;
});

export const TimeInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type">
>(function TimeInput({ ...props }, ref) {
  return <TextInput ref={ref} type="time" {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<"textarea">>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(controlBase, controlFocus, controlDisabled, "resize-y", className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, React.ComponentPropsWithoutRef<"select">>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={clsx(controlBase, controlFocus, controlDisabled, className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export const MultiSelect = forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<"select">
>(function MultiSelect({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      multiple
      className={clsx(controlBase, controlFocus, controlDisabled, "min-h-12", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"input"> & { type?: never }) {
  return (
    <input
      type="checkbox"
      className={clsx(
        "h-4 w-4 rounded border border-[var(--ds-color-border)] text-[var(--ds-color-accent)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
        className,
      )}
      {...props}
    />
  );
}

export function Radio({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"input"> & { type?: never }) {
  return (
    <input
      type="radio"
      className={clsx(
        "h-4 w-4 border border-[var(--ds-color-border)] text-[var(--ds-color-accent)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
        className,
      )}
      {...props}
    />
  );
}
