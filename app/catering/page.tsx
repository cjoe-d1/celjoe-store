import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

import {
  Button,
  Container,
  EditorialQuote,
  EditorialSplit,
  SectionTitle,
} from "components/chds";
import { EditorialHero } from "components/chds/page-sections";
import { ContentSection, FeatureGrid, CTASection } from "components/shared";
import Footer from "components/layout/footer";
import { QuotationForm } from "components/forms/quotation-form";
import { cateringContent } from "lib/content/catering";
import { buildMetadata } from "lib/seo";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Catering",
  description:
    "Celjoe Catering — weddings, corporate, birthdays, and private dining. Service-led events planned with intention.",
  path: "/catering",
});

async function CateringContent() {
  const { hero, eventsSection, eventCategories, packagesSection, packages, whyCeljoe, testimonialsSection, testimonials, quotation } = cateringContent;

  return (
    <>
      <EditorialHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={<>{hero.description}</>}
        imageUrl={hero.image}
        cta={
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Button asChild>
              <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
        }
      />

      <Container className="py-[var(--ds-space-16)]">
        <div className="flex flex-col gap-[var(--ds-space-3)]">
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {eventsSection.label}
          </span>
          <SectionTitle>{eventsSection.title}</SectionTitle>
        </div>
        <FeatureGrid items={eventCategories} label="Event" />
      </Container>

      <Container className="py-[var(--ds-space-12)]">
        <div className="flex flex-col gap-[var(--ds-space-3)]">
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {packagesSection.label}
          </span>
          <SectionTitle>{packagesSection.title}</SectionTitle>
        </div>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-6)] md:grid-cols-3">
          {packages.map((p) => (
            <div
              key={p.name}
              className="flex flex-col overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]"
            >
              {p.image ? (
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-[var(--ds-space-4)] p-[var(--ds-space-8)]">
                <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  Package
                </span>
                <h3 className="text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  {p.name}
                </h3>
                <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                  {p.description}
                </p>
                <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-[var(--ds-space-2)]">
                      <span aria-hidden className="text-[var(--ds-color-accent)]">
                        ·
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <EditorialSplit
        eyebrow={whyCeljoe.eyebrow}
        title={whyCeljoe.title}
        body={<>{whyCeljoe.body}</>}
        imageUrl={whyCeljoe.image}
      />

      <Container className="pb-[var(--ds-space-16)]">
        <div className="flex flex-col gap-[var(--ds-space-3)] items-center text-center">
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {testimonialsSection.label}
          </span>
          <SectionTitle className="text-center">{testimonialsSection.title}</SectionTitle>
        </div>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-6)] md:grid-cols-2">
          {testimonials.map((t) => (
            <EditorialQuote
              key={t.attribution}
              className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
            >
              <p className="text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-fg)]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                — {t.attribution}
              </footer>
            </EditorialQuote>
          ))}
        </div>
      </Container>

      <Container className="pb-[var(--ds-space-24)]" id="enquire">
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-10)] md:p-[var(--ds-space-16)]">
          <div className="flex flex-col gap-[var(--ds-space-3)]">
            <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              {quotation.label}
            </span>
            <SectionTitle>{quotation.title}</SectionTitle>
            <p className="max-w-prose text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              {quotation.description}
            </p>
          </div>

          <QuotationForm />
        </div>
      </Container>

      <Footer />
    </>
  );
}

function CateringSkeleton() {
  return (
    <div className="h-[60vh] w-full animate-pulse bg-[var(--ds-color-surface-muted)]" />
  );
}

export default async function CateringPage() {
  return (
    <main>
      <Suspense fallback={<CateringSkeleton />}>
        <CateringContent />
      </Suspense>
    </main>
  );
}
