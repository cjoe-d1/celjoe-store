import Image from "next/image";
import { Container, Label, SectionTitle } from "components/chds";
import type { ReactNode } from "react";

/** Reusable content section: label → title → prose body. */
export function ContentSection({
  label,
  title,
  children,
  className,
  imageUrl,
}: {
  label: string;
  title: string;
  children?: ReactNode;
  className?: string;
  imageUrl?: string | null;
}) {
  return (
    <Container className={className}>
      <div className="grid grid-cols-1 items-start gap-[var(--ds-space-12)] lg:grid-cols-2 lg:gap-[var(--ds-space-16)]">
        <div>
          <div className="flex flex-col gap-[var(--ds-space-3)]">
            <Label tone="muted">{label}</Label>
            <SectionTitle>{title}</SectionTitle>
          </div>
          {children ? (
            <div className="mt-[var(--ds-space-6)] max-w-prose text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
              {children}
            </div>
          ) : null}
        </div>
        {imageUrl ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]">
            <Image src={imageUrl} alt={title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        ) : null}
      </div>
    </Container>
  );
}

/** Reusable section title row with optional caption. */
export function SectionHeading({
  title,
  caption,
  className,
}: {
  title: string;
  caption?: string;
  className?: string;
}) {
  return (
    <Container className={className}>
      <SectionTitle>{title}</SectionTitle>
      {caption ? (
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          {caption}
        </p>
      ) : null}
    </Container>
  );
}
