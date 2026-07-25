import clsx from "clsx";
import { toast as sonnerToast } from "sonner";

export type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, string> = {
  info: "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-fg)]",
  success: "border-[color:var(--ds-color-success)]/30 bg-[color:var(--ds-color-success)]/10 text-[var(--ds-color-fg)]",
  warning: "border-[color:var(--ds-color-accent)]/30 bg-[color:var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]",
  danger: "border-[color:var(--ds-color-danger)]/30 bg-[color:var(--ds-color-danger)]/10 text-[var(--ds-color-fg)]",
};

export function Alert({
  title,
  children,
  tone = "info",
  className,
}: {
  title?: string;
  children: React.ReactNode;
  tone?: AlertTone;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={clsx(
        "rounded-[var(--ds-radius-xl)] border px-[var(--ds-space-4)] py-[var(--ds-space-4)]",
        tones[tone],
        className,
      )}
    >
      {title ? (
        <div className="mb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
          {title}
        </div>
      ) : null}
      <div className="text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)]">
        {children}
      </div>
    </div>
  );
}

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-color-border)]/40",
        className,
      )}
    />
  );
}

export type BannerTone = AlertTone;

export function Banner({
  children,
  tone = "info",
  className,
}: {
  children: React.ReactNode;
  tone?: BannerTone;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={clsx(
        "w-full rounded-[var(--ds-radius-xl)] border px-[var(--ds-space-4)] py-[var(--ds-space-3)]",
        tones[tone],
        className,
      )}
    >
      <div className="text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)]">
        {children}
      </div>
    </div>
  );
}

export type StatusTone = "neutral" | "success" | "warning" | "danger";

const statusToneClass: Record<StatusTone, string> = {
  neutral: "bg-[var(--ds-color-muted)]",
  success: "bg-[var(--ds-color-success)]",
  warning: "bg-[var(--ds-color-accent)]",
  danger: "bg-[var(--ds-color-danger)]",
};

export function StatusIndicator({
  tone = "neutral",
  label,
  className,
}: {
  tone?: StatusTone;
  label?: string;
  className?: string;
}) {
  return (
    <div className={clsx("inline-flex items-center gap-[var(--ds-space-2)]", className)}>
      <span className={clsx("h-2 w-2 rounded-full", statusToneClass[tone])} aria-hidden="true" />
      {label ? (
        <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function LoadingIndicator({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={clsx("inline-flex items-center gap-[var(--ds-space-2)]", className)}>
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--ds-color-border)] border-t-[var(--ds-color-accent)]"
      />
      <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
        {label}
      </span>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={clsx("h-2 w-full rounded-full bg-[var(--ds-color-border)]/40", className)}>
      <div
        className="h-full rounded-full bg-[var(--ds-color-accent)] transition-[width] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

export type ToastTone = "default" | "success" | "error";

export const toast = {
  show: (message: string) => sonnerToast(message),
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
} as const;
