import clsx from "clsx";

type BadgeTone = "neutral" | "accent" | "success" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral:
    "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-fg)]",
  accent: "border-[var(--ds-color-accent)]/30 bg-[var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]",
  success:
    "border-[var(--ds-color-success)]/30 bg-[var(--ds-color-success)]/10 text-[var(--ds-color-fg)]",
  danger:
    "border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 text-[var(--ds-color-fg)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-[var(--ds-space-3)] py-[var(--ds-space-1)] text-[length:var(--ds-text-label)] uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const ChefsPickBadge = (props: { className?: string }) => (
  <Badge tone="accent" className={props.className}>
    Chef&apos;s Pick
  </Badge>
);

export const SmokehouseBadge = (props: { className?: string }) => (
  <Badge tone="neutral" className={props.className}>
    Smokehouse
  </Badge>
);

export const LimitedAvailabilityBadge = (props: { className?: string }) => (
  <Badge tone="danger" className={props.className}>
    Limited
  </Badge>
);

export const FreshTodayBadge = (props: { className?: string }) => (
  <Badge tone="success" className={props.className}>
    Fresh Today
  </Badge>
);

