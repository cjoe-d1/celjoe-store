import clsx from "clsx";
import { Card } from "components/chds/card";
import { ProgressBar } from "components/chds/feedback";

export type CheckoutStep = {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
};

export function CheckoutProgress({
  steps,
  className,
}: {
  steps: CheckoutStep[];
  className?: string;
}) {
  const total = steps.length;
  const complete = steps.filter((s) => s.status === "complete").length;
  const value = total === 0 ? 0 : (complete / total) * 100;

  return (
    <div className={clsx("flex flex-col gap-[var(--ds-space-3)]", className)}>
      <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-3)]">
        <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
          Checkout
        </div>
        <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          Step {Math.min(total, complete + 1)} of {total}
        </div>
      </div>
      <ProgressBar value={value} />
      <ol className="flex flex-wrap gap-[var(--ds-space-2)] text-[length:var(--ds-text-caption)]">
        {steps.map((step) => (
          <li
            key={step.id}
            className={clsx(
              "rounded-full border px-[var(--ds-space-3)] py-[var(--ds-space-1)]",
              step.status === "complete"
                ? "border-[var(--ds-color-success)]/30 bg-[var(--ds-color-success)]/10 text-[var(--ds-color-fg)]"
                : step.status === "current"
                  ? "border-[var(--ds-color-accent)]/30 bg-[var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]"
                  : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-muted)]",
            )}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CheckoutStepCard({
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
    <Card variant="editorial" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="mb-[var(--ds-space-4)]">
        <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          {title}
        </div>
        {description ? (
          <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export function AddressCard(props: Parameters<typeof CheckoutStepCard>[0]) {
  return <CheckoutStepCard {...props} />;
}

export function PaymentCard(props: Parameters<typeof CheckoutStepCard>[0]) {
  return <CheckoutStepCard {...props} />;
}

export function DeliveryCard(props: Parameters<typeof CheckoutStepCard>[0]) {
  return <CheckoutStepCard {...props} />;
}

export function OrderSummaryCard({
  title = "Order Summary",
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="editorial" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      {children}
    </Card>
  );
}

export function SuccessSummary({
  title = "Order confirmed",
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="editorial" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      {description ? (
        <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          {description}
        </div>
      ) : null}
      {children ? <div className="mt-[var(--ds-space-6)]">{children}</div> : null}
    </Card>
  );
}

