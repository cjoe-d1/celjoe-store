import clsx from "clsx";
import { cloneElement, forwardRef, isValidElement } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "text"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "color"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-lg)] font-medium transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] select-none";

const focus =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]";

const disabled =
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-[var(--ds-space-3)] text-[var(--ds-text-caption)]",
  md: "h-10 px-[var(--ds-space-4)] text-[var(--ds-text-body)]",
  lg: "h-12 px-[var(--ds-space-6)] text-[var(--ds-text-body)]",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ds-color-accent)] text-white hover:brightness-95 active:brightness-90",
  secondary:
    "bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-fg)] hover:bg-[color:var(--ds-color-surface)] border border-[var(--ds-color-border)]",
  ghost:
    "bg-transparent text-[var(--ds-color-fg)] hover:bg-[var(--ds-color-surface-muted)]",
  outline:
    "bg-transparent text-[var(--ds-color-fg)] border border-[var(--ds-color-border)] hover:bg-[var(--ds-color-surface-muted)]",
  text: "bg-transparent text-[var(--ds-color-fg)] hover:underline underline-offset-4",
  danger:
    "bg-[var(--ds-color-danger)] text-white hover:brightness-95 active:brightness-90",
  success:
    "bg-[var(--ds-color-success)] text-white hover:brightness-95 active:brightness-90",
};

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    asChild = false,
    disabled: disabledProp,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabledProp || loading;

  const mergedClassName = clsx(
    base,
    focus,
    disabled,
    sizes[size],
    variants[variant],
    loading && "cursor-wait",
    className,
  );

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error("Button with asChild expects a single React element child.");
    }

    return cloneElement(children as any, {
      ref,
      className: clsx(mergedClassName, (children as any).props?.className),
      "aria-disabled": isDisabled || undefined,
      ...(props as any),
    });
  }

  return (
    <button
      ref={ref as any}
      type={type}
      className={mergedClassName}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : leftIcon ? (
        <span aria-hidden="true" className="shrink-0">
          {leftIcon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      {rightIcon ? (
        <span aria-hidden="true" className="shrink-0">
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
});

export type IconButtonProps = Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> & {
  icon: React.ReactNode;
  "aria-label": string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, className, size = "md", ...props }, ref) {
    const iconPadding =
      size === "sm"
        ? "h-9 w-9"
        : size === "lg"
          ? "h-12 w-12"
          : "h-10 w-10";

    return (
      <Button
        ref={ref}
        {...props}
        size={size}
        className={clsx("px-0", iconPadding, className)}
      >
        <span aria-hidden="true" className="flex items-center justify-center">
          {icon}
        </span>
      </Button>
    );
  },
);

export function ButtonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      className={clsx(
        "inline-flex overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SplitButton({
  primary,
  secondary,
  className,
}: {
  primary: React.ReactElement<ButtonProps>;
  secondary: React.ReactElement<ButtonProps>;
  className?: string;
}) {
  return (
    <ButtonGroup className={className}>
      {primary}
      <div className="w-px bg-[var(--ds-color-border)]" />
      {secondary}
    </ButtonGroup>
  );
}
