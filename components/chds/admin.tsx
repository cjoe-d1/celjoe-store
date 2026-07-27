import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export type AdminNavItem = {
  label: string;
  href: string;
  description?: string;
  icon: ReactNode;
  badge?: string | number;
};

export function AdminSidebar({
  items,
  currentPath,
  className,
}: {
  items: AdminNavItem[];
  currentPath: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Operations"
      className={clsx(
        "flex h-full flex-col gap-[var(--ds-space-2)] p-[var(--ds-space-4)]",
        className,
      )}
    >
      <div className="px-[var(--ds-space-2)] pb-[var(--ds-space-3)] text-[length:var(--ds-text-label)] uppercase tracking-[0.18em] text-[var(--ds-color-muted)]">
        Operations
      </div>
      <ul className="flex flex-col gap-[var(--ds-space-1)]">
        {items.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/admin" && currentPath.startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "group flex items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] transition-colors",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
                  isActive
                    ? "bg-[var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]"
                    : "text-[var(--ds-color-muted)] hover:bg-[var(--ds-color-surface-muted)] hover:text-[var(--ds-color-fg)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center",
                    isActive
                      ? "text-[var(--ds-color-accent)]"
                      : "text-[var(--ds-color-muted)] group-hover:text-[var(--ds-color-fg)]",
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-[var(--ds-color-accent)]/15 px-[var(--ds-space-2)] py-0 text-[length:var(--ds-text-caption)] text-[var(--ds-color-accent)]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AdminTopBar({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-[var(--ds-space-2)] border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-6)] py-[var(--ds-space-5)] md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-medium)] tracking-tight text-[var(--ds-color-fg)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-[var(--ds-space-6)] px-[var(--ds-space-6)] py-[var(--ds-space-6)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-6)] py-[var(--ds-space-10)] text-center",
        className,
      )}
    >
      <div className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      {description ? (
        <p className="mx-auto mt-[var(--ds-space-2)] max-w-md text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-[var(--ds-space-4)] flex justify-center">{action}</div>
      ) : null}
    </div>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const toneClass: Record<string, string> = {
    pending:
      "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-muted)]",
    confirmed:
      "border-[var(--ds-color-accent)]/30 bg-[var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]",
    preparing:
      "border-[var(--ds-color-accent)]/40 bg-[var(--ds-color-accent)]/15 text-[var(--ds-color-fg)]",
    ready:
      "border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/15 text-[var(--ds-color-fg)]",
    completed:
      "border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/15 text-[var(--ds-color-fg)]",
    cancelled:
      "border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/15 text-[var(--ds-color-fg)]",
    available:
      "border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/15 text-[var(--ds-color-fg)]",
    offline:
      "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-muted)]",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-[var(--ds-space-3)] py-[var(--ds-space-1)] text-[length:var(--ds-text-label)] uppercase tracking-wide",
        toneClass[status] ?? toneClass.pending,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
