import clsx from "clsx";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={clsx("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-[var(--ds-space-2)] gap-y-[var(--ds-space-1)] text-[var(--ds-color-muted)]">
        {items.map((item, idx) => (
          <li key={`${item.label}-${idx}`} className="flex items-center gap-[var(--ds-space-2)]">
            {idx > 0 ? (
              <span aria-hidden="true" className="text-[var(--ds-color-border)]">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:text-[var(--ds-color-fg)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--ds-color-fg)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export type TabItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export function Tabs({
  items,
  activeId,
  onChange,
  className,
}: {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-wrap gap-[var(--ds-space-2)]", className)} role="tablist">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={item.disabled || undefined}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={clsx(
              "rounded-full border px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] transition-[background-color,color,border-color] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
              item.disabled ? "cursor-not-allowed opacity-50" : "",
              isActive
                ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)] text-white"
                : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-fg)] hover:bg-[var(--ds-color-surface-muted)]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export type PaginationModel = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({
  model,
  onPageChange,
  className,
}: {
  model: PaginationModel;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { currentPage, totalPages } = model;
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2),
  );

  return (
    <nav aria-label="Pagination" className={clsx("flex items-center gap-[var(--ds-space-2)]", className)}>
      <button
        type="button"
        onClick={() => (canPrev ? onPageChange(currentPage - 1) : null)}
        disabled={!canPrev}
        className={clsx(
          "rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
          !canPrev ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--ds-color-surface-muted)]",
        )}
      >
        Prev
      </button>
      {pages.map((p) => {
        const active = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "h-9 w-9 rounded-full border text-[length:var(--ds-text-caption)]",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
              active
                ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)] text-white"
                : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-fg)] hover:bg-[var(--ds-color-surface-muted)]",
            )}
          >
            {p}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => (canNext ? onPageChange(currentPage + 1) : null)}
        disabled={!canNext}
        className={clsx(
          "rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
          !canNext ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--ds-color-surface-muted)]",
        )}
      >
        Next
      </button>
    </nav>
  );
}

