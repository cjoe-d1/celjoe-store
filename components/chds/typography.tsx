import clsx from "clsx";

type TextTone = "default" | "muted";

type BaseProps = {
  className?: string;
  tone?: TextTone;
};

const toneClass: Record<TextTone, string> = {
  default: "text-[var(--ds-color-fg)]",
  muted: "text-[var(--ds-color-muted)]",
};

export function Display({
  className,
  tone = "default",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={clsx(
        "font-[var(--ds-font-weight-medium)] tracking-tight text-[length:var(--ds-text-display)] leading-[var(--ds-leading-display)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function H1({
  className,
  tone = "default",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={clsx(
        "font-[var(--ds-font-weight-medium)] tracking-tight text-[length:var(--ds-text-h1)] leading-[var(--ds-leading-heading)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function H2({
  className,
  tone = "default",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={clsx(
        "font-[var(--ds-font-weight-medium)] tracking-tight text-[length:var(--ds-text-h2)] leading-[var(--ds-leading-heading)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function H3({
  className,
  tone = "default",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={clsx(
        "font-[var(--ds-font-weight-medium)] tracking-tight text-[length:var(--ds-text-h3)] leading-[var(--ds-leading-heading)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function H4({
  className,
  tone = "default",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"h4">) {
  return (
    <h4
      className={clsx(
        "font-[var(--ds-font-weight-medium)] tracking-tight text-[length:var(--ds-text-h4)] leading-[var(--ds-leading-heading)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Body({
  className,
  tone = "default",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={clsx(
        "text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Caption({
  className,
  tone = "muted",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={clsx(
        "text-[length:var(--ds-text-caption)] leading-[var(--ds-leading-body)]",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  tone = "muted",
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={clsx(
        "text-[length:var(--ds-text-label)] uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  className,
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={clsx(
        "font-[var(--ds-font-weight-medium)] tracking-tight text-[length:var(--ds-text-h3)] leading-[var(--ds-leading-heading)]",
        toneClass.default,
        className,
      )}
      {...props}
    />
  );
}

export function EditorialQuote({
  className,
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote
      className={clsx(
        "border-l border-[var(--ds-color-border)] pl-[var(--ds-space-4)] italic text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-fg)]",
        className,
      )}
      {...props}
    />
  );
}

export function KitchenNote({
  className,
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={clsx(
        "rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] leading-[var(--ds-leading-body)] text-[var(--ds-color-fg)]",
        className,
      )}
      {...props}
    />
  );
}

export function DashboardMetric({
  className,
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx(
        "font-[var(--ds-font-weight-semibold)] tracking-tight text-[length:var(--ds-text-h2)] leading-[var(--ds-leading-heading)] text-[var(--ds-color-fg)]",
        className,
      )}
      {...props}
    />
  );
}

