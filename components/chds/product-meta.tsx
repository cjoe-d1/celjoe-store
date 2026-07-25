import clsx from "clsx";

export type ProductMetaRow = {
  label: string;
  value: React.ReactNode;
};

export function ProductMeta({
  title = "Product details",
  rows,
  className,
}: {
  title?: string;
  rows: ProductMetaRow[];
  className?: string;
}) {
  if (!rows.length) return null;

  return (
    <section className={clsx("mt-[var(--ds-space-8)]", className)}>
      <div className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
        {title}
      </div>
      <dl className="grid grid-cols-1 gap-[var(--ds-space-3)]">
        {rows.map((row, idx) => (
          <div
            key={`${row.label}-${idx}`}
            className="flex items-start justify-between gap-[var(--ds-space-4)] border-b border-[var(--ds-color-border)] pb-[var(--ds-space-3)]"
          >
            <dt className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              {row.label}
            </dt>
            <dd className="text-right text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export type PairingItem = {
  id: string;
  title: string;
  description?: string;
  href?: string;
};

export function PerfectPairings({
  title = "Perfect pairings",
  items,
  className,
}: {
  title?: string;
  items: PairingItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <section className={clsx("mt-[var(--ds-space-10)]", className)}>
      <div className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      <ul className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)] shadow-[var(--ds-shadow-sm)]"
          >
            <div className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
              {item.href ? (
                <a
                  href={item.href}
                  className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
                >
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </div>
            {item.description ? (
              <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                {item.description}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelatedProductsShell({
  title = "Related Products",
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("py-[var(--ds-space-8)]", className)}>
      <h2 className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </h2>
      <div className="w-full overflow-x-auto">
        <div className="flex w-full gap-4 pt-1">{children}</div>
      </div>
    </section>
  );
}

