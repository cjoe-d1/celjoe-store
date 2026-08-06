import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Drawer } from "components/chds/overlays";
import { CartEmpty } from "components/chds/empty-states";
import { PriceDisplay } from "components/chds/product";
import { Button } from "components/chds/button";
import { formatCurrency } from "lib/format-currency";

export type CartLine = {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  quantity: number;
  lineTotal: { amount: string; currencyCode: string };
};

export type CartSummary = {
  subtotal: { amount: string; currencyCode: string };
  tax: { amount: string; currencyCode: string };
  total: { amount: string; currencyCode: string };
};

export function QuantityControls({
  quantity,
  onDecrease,
  onIncrease,
  disabled,
  className,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "inline-flex h-9 items-center rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
        disabled ? "opacity-50" : "",
        className,
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease quantity"
        className="h-9 w-9 rounded-full transition-colors hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)] disabled:cursor-not-allowed"
      >
        -
      </button>
      <div className="min-w-10 text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
        {quantity}
      </div>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
        className="h-9 w-9 rounded-full transition-colors hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)] disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
}

export function CartItem({
  item,
  onRemove,
  onDecrease,
  onIncrease,
  className,
}: {
  item: CartLine;
  onRemove: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-[var(--ds-space-4)]", className)}>
      <div className="relative h-16 w-16 overflow-hidden rounded-md border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? item.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-[var(--ds-space-4)]">
          <Link
            href={item.href}
            className="min-w-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
          >
            <div className="truncate text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              {item.title}
            </div>
            {item.subtitle ? (
              <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                {item.subtitle}
              </div>
            ) : null}
          </Link>
          <div className="shrink-0 text-right">
            <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              {formatCurrency(item.lineTotal.amount)}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)] hover:text-[var(--ds-color-fg)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
            >
              Remove
            </button>
          </div>
        </div>
        <div className="mt-[var(--ds-space-3)] flex items-center justify-between">
          <QuantityControls
            quantity={item.quantity}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
          />
        </div>
      </div>
    </div>
  );
}

export function OrderSummary({
  summary,
  className,
}: {
  summary: CartSummary;
  className?: string;
}) {
  return (
    <div className={clsx("pt-[var(--ds-space-4)] text-sm text-[var(--ds-color-muted)]", className)}>
      <div className="mb-3 flex items-center justify-between border-b border-[var(--ds-color-border)] pb-1">
        <p>Taxes</p>
        <span className="text-[var(--ds-color-fg)]">
          {formatCurrency(summary.tax.amount)}
        </span>
      </div>
      <div className="mb-3 flex items-center justify-between border-b border-[var(--ds-color-border)] pb-1 pt-1">
        <p>Shipping</p>
        <p className="text-right">Calculated at checkout</p>
      </div>
      <div className="mb-3 flex items-center justify-between border-b border-[var(--ds-color-border)] pb-1 pt-1">
        <p>Total</p>
        <span className="text-[var(--ds-color-fg)]">
          {formatCurrency(summary.total.amount)}
        </span>
      </div>
    </div>
  );
}

export function PromoCode({
  value,
  onChange,
  onApply,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-[var(--ds-space-3)]", className)}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Promo code"
        disabled={disabled}
        className="h-10 flex-1 rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-4)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] placeholder:text-[var(--ds-color-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)] disabled:opacity-50"
      />
      <Button variant="outline" size="sm" disabled={disabled} onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}

export function MiniCart({
  totalQuantity,
  subtotal,
  className,
}: {
  totalQuantity: number;
  subtotal: { amount: string; currencyCode: string };
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-[var(--ds-space-4)]", className)}>
      <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
        {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
      </div>
      <PriceDisplay amount={subtotal.amount} currencyCode={subtotal.currencyCode} />
    </div>
  );
}

export function CartDrawer({
  open,
  onClose,
  items,
  summary,
  onCheckout,
  renderItem,
}: {
  open: boolean;
  onClose: () => void;
  items: CartLine[];
  summary: CartSummary;
  onCheckout: () => void;
  renderItem: (item: CartLine) => React.ReactNode;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="My Cart">
      {items.length === 0 ? (
        <div className="mt-20">
          <CartEmpty />
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-[var(--ds-space-5)]">
            {items.map((item) => (
              <div key={item.id}>{renderItem(item)}</div>
            ))}
          </div>
          <div className="mt-[var(--ds-space-6)]">
            <OrderSummary summary={summary} />
            <div className="mt-[var(--ds-space-4)]">
              <Button className="w-full" onClick={onCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

