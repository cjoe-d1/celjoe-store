import clsx from "clsx";
import { Skeleton } from "components/chds/feedback";

export function CardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-sm)]",
        className,
      )}
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-[var(--ds-space-3)] h-8 w-40" />
      <Skeleton className="mt-[var(--ds-space-4)] h-4 w-full" />
      <Skeleton className="mt-[var(--ds-space-2)] h-4 w-5/6" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
        className,
      )}
    >
      <div className="p-[var(--ds-space-4)]">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="border-t border-[var(--ds-color-border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-[var(--ds-space-4)] border-b border-[var(--ds-color-border)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] last:border-0"
          >
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
        className,
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-[var(--ds-space-5)]">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-[var(--ds-space-2)] h-4 w-24" />
      </div>
    </div>
  );
}

export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-[var(--ds-space-4)]", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-[var(--ds-space-2)]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-[var(--ds-radius-xl)]" />
        </div>
      ))}
    </div>
  );
}

