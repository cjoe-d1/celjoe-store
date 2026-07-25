import clsx from "clsx";
import { Card } from "components/chds/card";

export function KpiCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <Card variant="dashboard" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
        {label}
      </div>
      <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-semibold)] tracking-tight text-[var(--ds-color-fg)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          {hint}
        </div>
      ) : null}
    </Card>
  );
}

export function ChartWrapper({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="dashboard" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      <div className="w-full">{children}</div>
    </Card>
  );
}

export function ActivityFeed({
  title = "Activity",
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="dashboard" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      <div className="flex flex-col gap-[var(--ds-space-3)]">{children}</div>
    </Card>
  );
}

export function StatusWidget({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="dashboard" className={clsx("p-[var(--ds-space-6)]", className)}>
      <div className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {title}
      </div>
      {children}
    </Card>
  );
}

