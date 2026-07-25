import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Container,
  EditorialSplit,
  Label,
  SectionTitle,
  Stack,
} from "components/chds";
import { EditorialHero, PageHeader } from "components/chds/page-sections";
import Footer from "components/layout/footer";
import { buildMetadata } from "lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Our Story",
  description:
    "The story behind Celjoe — our hospitality philosophy, kitchen standards, and the people who cook.",
  path: "/our-story",
});

const TIMELINE = [
  { year: "2018", label: "A small kitchen", body: "Celjoe began as a weekend kitchen for friends, family, and the occasional office lunch." },
  { year: "2020", label: "First supper club", body: "We hosted our first ticketed supper. Every seat sold within a weekend." },
  { year: "2022", label: "A permanent home", body: "The kitchen grew up. We took on a permanent home and built the team around it." },
  { year: "2024", label: "The Smokehouse", body: "We added an offset hardwood smoker. The Smokehouse became its own experience." },
  { year: "Today", label: "Still small on purpose", body: "We still cook in small batches. We still answer the phone." },
];

const VALUES = [
  { title: "Hospitality first", body: "We treat every guest like a friend at the table." },
  { title: "Honest sourcing", body: "We work with farms and suppliers we can name. We pay them properly." },
  { title: "Patient cooking", body: "We don't rush. The kitchen is built around time, not convenience." },
  { title: "Editorial presentation", body: "Food deserves to be seen, not just eaten. We plate for the camera, too." },
];

const STANDARDS = [
  "Every dish is finished to order.",
  "Every ingredient is logged. We can trace it back.",
  "Every member of the kitchen team has a voice on the menu.",
  "Every guest is greeted by name, where possible.",
];

async function StoryContent() {
  return (
    <>
      <EditorialHero
        eyebrow="Our Story"
        title="Hospitality before technology"
        description={
          <>
            We started with a question: what would a neighbourhood kitchen
            look like if it were built on patience? That question is still
            the answer.
          </>
        }
      />

      <Container className="py-[var(--ds-space-16)]">
        <Stack gap="3">
          <Label tone="muted">The Philosophy</Label>
          <SectionTitle>Cooking for the long table</SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-6)] max-w-prose space-y-[var(--ds-space-4)] text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
          <p>
            We don&apos;t believe in shortcuts, and we don&apos;t believe in
            spectacle. We believe in the long table — the one that fits
            family, friends, and the friend-of-friend who just arrived. We
            cook for that table.
          </p>
          <p>
            Every decision — what we buy, who we hire, what we charge —
            starts with hospitality. Technology should make the experience
            quieter, not louder.
          </p>
        </div>
      </Container>

      <EditorialSplit
        eyebrow="Kitchen Standards"
        title="What we hold ourselves to"
        body={
          <>
            These are the standards we set, and the ones we hold each other
            to. They are not aspirational. They are how we work.
          </>
        }
        reverse
      />
      <Container className="pb-[var(--ds-space-16)]">
        <ul className="mx-auto max-w-2xl divide-y divide-[var(--ds-color-border)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]">
          {STANDARDS.map((s) => (
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
        <Stack gap="3">
          <Label tone="muted">Values</Label>
          <SectionTitle>What we believe</SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <article
              key={v.title}
              className="flex flex-col gap-[var(--ds-space-2)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)]"
            >
              <Label tone="muted">Value</Label>
              <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                {v.title}
              </h3>
              <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                {v.body}
              </p>
            </article>
          ))}
        </div>
      </Container>

      <PageHeader
        eyebrow="Timeline"
        title="How we got here"
        description="A short version of the long story."
      />
      <Container className="py-[var(--ds-space-16)]">
        <ol className="mx-auto max-w-2xl space-y-[var(--ds-space-8)]">
          {TIMELINE.map((t) => (
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

      <Container className="pb-[var(--ds-space-24)]">
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-10)] md:p-[var(--ds-space-16)] text-center">
          <Label tone="muted">An Invitation</Label>
          <SectionTitle className="mt-[var(--ds-space-3)]">Come eat with us</SectionTitle>
          <p className="mx-auto mt-[var(--ds-space-4)] max-w-prose text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            The kitchen is open most days, and the door is always the same.
          </p>
        </div>
      </Container>

      <Footer />
    </>
  );
}

function StorySkeleton() {
  return (
    <div className="h-[40vh] w-full animate-pulse bg-[var(--ds-color-surface-muted)]" />
  );
}

export default function OurStoryPage() {
  return (
    <main>
      <Suspense fallback={<StorySkeleton />}>
        <StoryContent />
      </Suspense>
    </main>
  );
}
