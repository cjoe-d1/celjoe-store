import clsx from "clsx";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "w-full overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
        className,
      )}
    >
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({
  children,
  className,
}: React.ComponentPropsWithoutRef<"table">) {
  return (
    <table className={clsx("w-full border-collapse", className)}>{children}</table>
  );
}

export function TableHead({
  children,
  className,
}: React.ComponentPropsWithoutRef<"thead">) {
  return (
    <thead className={clsx("bg-[var(--ds-color-surface-muted)]", className)}>
      {children}
    </thead>
  );
}

export function TableRow({
  children,
  className,
}: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={clsx(
        "border-b border-[var(--ds-color-border)] last:border-0",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  className,
  align = "left",
}: React.ComponentPropsWithoutRef<"th"> & { align?: "left" | "right" | "center" }) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th
      className={clsx(
        "px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]",
        alignClass,
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  align = "left",
}: React.ComponentPropsWithoutRef<"td"> & { align?: "left" | "right" | "center" }) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <td
      className={clsx(
        "px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]",
        alignClass,
        className,
      )}
    >
      {children}
    </td>
  );
}

export function SortableHeader({
  label,
  active,
  direction,
  onToggle,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "inline-flex items-center gap-[var(--ds-space-2)]",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
      )}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-[var(--ds-color-border)]">
        {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

export function FilterRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BulkActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-wrap items-center gap-[var(--ds-space-3)]", className)}>
      {children}
    </div>
  );
}

export function EmptyTable({
  title = "No data.",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-6)] py-[var(--ds-space-8)] text-center",
        className,
      )}
    >
      <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      {description ? (
        <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          {description}
        </div>
      ) : null}
    </div>
  );
}

