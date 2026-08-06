import Image from "next/image";
import { Button, Container, Label, SectionTitle } from "components/chds";
import Link from "next/link";
import type { ReactNode } from "react";

export interface CtaLink {
  label: string;
  href: string;
}

/** Centered CTA card with label, title, description, and action buttons. */
export function CTASection({
  label,
  title,
  description,
  primaryCta,
  secondaryCta,
  backgroundImage,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  primaryCta?: CtaLink;
  secondaryCta?: CtaLink;
  backgroundImage?: string | null;
  children?: ReactNode;
}) {
  return (
    <Container className="pb-[var(--ds-space-16)]">
      <div className="relative isolate overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] p-[var(--ds-space-10)] md:p-[var(--ds-space-16)] text-center">
        {backgroundImage ? (
          <>
            <Image
              src={backgroundImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-[color:var(--ds-color-bg)]/75" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-[var(--ds-color-surface)]" />
        )}
        <div className="relative">
          <Label tone="muted">{label}</Label>
          <SectionTitle className="mt-[var(--ds-space-3)]">{title}</SectionTitle>
          {description ? (
            <p className="mx-auto mt-[var(--ds-space-4)] max-w-prose text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              {description}
            </p>
          ) : null}
          {primaryCta || secondaryCta ? (
            <div className="mt-[var(--ds-space-6)] flex flex-wrap justify-center gap-[var(--ds-space-3)]">
              {primaryCta ? (
                <Button asChild>
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button variant="outline" asChild>
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </Container>
  );
}
