import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Container,
  EditorialSplit,
  SectionTitle,
} from "components/chds";
import { EditorialHero, PageHeader } from "components/chds/page-sections";
import { ContentSection, FeatureGrid, CTASection } from "components/shared";
import Footer from "components/layout/footer";
import { ourStoryContent } from "lib/content/our-story";
import { buildMetadata } from "lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Our Story",
  description:
    "The story behind Celjoe — a Lagos-born hospitality brand built on culinary excellence, ingredient integrity, and a commitment to crafting memorable dining experiences from kitchen to table.",
  path: "/our-story",
});

async function StoryContent() {
  const { hero, philosophy, standards, values, timeline, invitation } = ourStoryContent;

  return (
    <>
      <EditorialHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={<>{hero.description}</>}
        imageUrl={hero.image}
      />

      <ContentSection label={philosophy.label} title={philosophy.title} className="py-[var(--ds-space-16)]">
        {philosophy.paragraphs.map((p, i) => (
          <p key={i} className={i > 0 ? "mt-[var(--ds-space-4)]" : ""}>
            {p}
          </p>
        ))}
      </ContentSection>

      <EditorialSplit
        eyebrow={standards.eyebrow}
        title={standards.title}
        body={<>{standards.body}</>}
        imageUrl={standards.image}
        reverse
      />
      <Container className="pb-[var(--ds-space-16)]">
        <ul className="mx-auto max-w-2xl divide-y divide-[var(--ds-color-border)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]">
          {standards.items.map((s) => (
            <li
              key={s}
              className="flex items-start gap-[var(--ds-space-4)] p-[var(--ds-space-5)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
            >
              <span aria-hidden className="mt-[6px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ds-color-accent)]" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="pb-[var(--ds-space-16)]">
        <div className="flex flex-col gap-[var(--ds-space-3)]">
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {values.label}
          </span>
          <SectionTitle>{values.title}</SectionTitle>
        </div>
        <FeatureGrid items={values.items} label="Value" columns={4} />
      </Container>

      <PageHeader
        eyebrow={timeline.eyebrow}
        title={timeline.title}
        description={timeline.description}
      />
      <Container className="py-[var(--ds-space-16)]">
        <ol className="mx-auto max-w-2xl space-y-[var(--ds-space-8)]">
          {timeline.entries.map((t) => (
            <li key={t.year} className="grid grid-cols-[80px_1fr] gap-[var(--ds-space-6)]">
              <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-accent)]">
                {t.year}
              </div>
              <div>
                <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  {t.label}
                </div>
                <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                  {t.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      <CTASection
        label={invitation.label}
        title={invitation.title}
        description={invitation.description}
        backgroundImage={invitation.backgroundImage}
      />

      <Footer />
    </>
  );
}

function StorySkeleton() {
  return (
    <div className="h-[40vh] w-full animate-pulse bg-[var(--ds-color-surface-muted)]" />
  );
}

export default async function OurStoryPage() {
  return <main><Suspense fallback={<StorySkeleton />}><StoryContent /></Suspense></main>;
}
