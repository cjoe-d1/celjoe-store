import clsx from "clsx";
import { Card } from "components/chds/card";
import { Toggle } from "components/chds/forms-interactive";

export function CmsPanel({
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
    <Card variant="cms" className={clsx("p-[var(--ds-space-6)]", className)}>
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

export function SeoPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CmsPanel title="SEO" className={className}>
      {children}
    </CmsPanel>
  );
}

export function VisibilityToggle({
  checked,
  onCheckedChange,
  label = "Visible",
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-[var(--ds-space-4)]", className)}>
      <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">{label}</div>
      <Toggle aria-label={label} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function DragHandle({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "inline-flex h-10 w-10 items-center justify-center rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-muted)]",
        className,
      )}
    >
      ⋮⋮
    </div>
  );
}

export function MediaPickerShell({
  title = "Media",
  description = "Select or upload media.",
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CmsPanel title={title} description={description} className={className}>
      {children}
    </CmsPanel>
  );
}

