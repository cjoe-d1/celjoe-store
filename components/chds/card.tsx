import clsx from "clsx";

export type CardVariant =
  | "editorial"
  | "product"
  | "category"
  | "feature"
  | "stat"
  | "dashboard"
  | "cms"
  | "order"
  | "customer"
  | "empty";

const variants: Record<CardVariant, string> = {
  editorial:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  product:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  category:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  feature:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  stat:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  dashboard:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  cms:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  order:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  customer:
    "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
  empty:
    "rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
};

export function Card({
  children,
  className,
  variant = "editorial",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  interactive?: boolean;
}) {
  return (
    <div
      className={clsx(
        variants[variant],
        "p-[var(--ds-space-6)]",
        interactive &&
          "transition-[transform,box-shadow] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:shadow-[var(--ds-shadow-md)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-[var(--ds-space-4)]", className)}>{children}</div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mt-[var(--ds-space-4)]", className)}>{children}</div>
  );
}

