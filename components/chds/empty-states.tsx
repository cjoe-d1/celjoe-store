import clsx from "clsx";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
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

export const CartEmpty = (props: { className?: string }) => (
  <EmptyState
    title="Your cart is empty."
    description="When you're ready, add something thoughtfully made."
    className={props.className}
  />
);

export const OrdersEmpty = (props: { className?: string }) => (
  <EmptyState
    title="No orders yet."
    description="When an order arrives, it will appear here."
    className={props.className}
  />
);

export const SearchEmpty = (props: { className?: string }) => (
  <EmptyState
    title="No results found."
    description="Try a different phrase or browse by category."
    className={props.className}
  />
);

