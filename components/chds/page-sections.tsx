import clsx from "clsx";
import { Container, Label, Stack } from "components/chds";

/**
 * Editorial page header used at the top of every customer landing page.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]",
        className,
      )}
    >
      <Container className="py-[var(--ds-space-16)]">
        <div
          className={clsx(
            "max-w-3xl",
            align === "center" ? "mx-auto text-center" : "",
          )}
        >
          {eyebrow ? (
            <Label tone="muted" className="mb-[var(--ds-space-3)] block">
              {eyebrow}
            </Label>
          ) : null}
          <h1 className="text-[length:var(--ds-text-display)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-display)] tracking-tight text-[var(--ds-color-fg)]">
            {title}
          </h1>
          {description ? (
            <div className="mt-[var(--ds-space-5)] text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
              {description}
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}

/**
 * Editorial hero with a full-bleed background image and overlay copy.
 * Optional `dark` tone enables the Smokehouse/BBQ charcoal palette.
 */
export function EditorialHero({
  eyebrow,
  title,
  description,
  imageUrl,
  cta,
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  imageUrl?: string | null;
  cta?: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const isDark = tone === "dark";
  return (
    <section
      data-page-hero={tone}
      className={clsx(
        "relative isolate overflow-hidden",
        isDark
          ? "bg-[#14110F] text-[#F6F1EA]"
          : "bg-[var(--ds-color-surface-muted)]",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : null}
      <div
        aria-hidden
        className={clsx(
          "absolute inset-0 -z-10",
          isDark
            ? "bg-gradient-to-b from-[#14110F]/80 via-[#14110F]/55 to-[#14110F]/95"
            : "bg-gradient-to-b from-[color:var(--ds-color-bg)]/15 via-[color:var(--ds-color-bg)]/30 to-[color:var(--ds-color-bg)]/85",
        )}
      />
      <Container className="py-[var(--ds-space-24)] md:py-[var(--ds-space-32)]">
        <div className="max-w-2xl">
          {eyebrow ? (
            <Label
              className={clsx(
                "mb-[var(--ds-space-4)] block tracking-[0.2em]",
                isDark ? "text-[#E6B266]" : "text-[var(--ds-color-accent)]",
              )}
            >
              {eyebrow}
            </Label>
          ) : null}
          <h1
            className={clsx(
              "text-[length:var(--ds-text-display)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-display)] tracking-tight",
              isDark ? "text-[#F6F1EA]" : "text-[var(--ds-color-fg)]",
            )}
          >
            {title}
          </h1>
          {description ? (
            <div
              className={clsx(
                "mt-[var(--ds-space-6)] text-[length:var(--ds-text-h4)] leading-[var(--ds-leading-body)]",
                isDark ? "text-[#DCD3C5]" : "text-[var(--ds-color-muted)]",
              )}
            >
              {description}
            </div>
          ) : null}
          {cta ? <div className="mt-[var(--ds-space-8)]">{cta}</div> : null}
        </div>
      </Container>
    </section>
  );
}

/**
 * Two-column editorial split: copy on one side, image on the other.
 */
export function EditorialSplit({
  eyebrow,
  title,
  body,
  imageUrl,
  imageAlt,
  reverse = false,
  cta,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
  imageUrl?: string | null;
  imageAlt?: string;
  reverse?: boolean;
  cta?: React.ReactNode;
  className?: string;
}) {
  return (
    <Container className={clsx("py-[var(--ds-space-16)]", className)}>
      <div
        className={clsx(
          "grid grid-cols-1 items-center gap-[var(--ds-space-12)] lg:grid-cols-2 lg:gap-[var(--ds-space-16)]",
          reverse ? "lg:[&>*:first-child]:order-2" : "",
        )}
      >
        <Stack gap="5">
          {eyebrow ? <Label tone="muted">{eyebrow}</Label> : null}
          <h2 className="text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-heading)] tracking-tight text-[var(--ds-color-fg)]">
            {title}
          </h2>
          {body ? (
            <div className="text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
              {body}
            </div>
          ) : null}
          {cta ? <div className="pt-[var(--ds-space-2)]">{cta}</div> : null}
        </Stack>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={imageAlt ?? ""}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      </div>
    </Container>
  );
}
