import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Button,
  Container,
  EditorialQuote,
  EditorialSplit,
  Label,
  SectionTitle,
  Stack,
} from "components/chds";
import { EditorialHero } from "components/chds/page-sections";
import Footer from "components/layout/footer";
import { QuotationForm } from "components/forms/quotation-form";
import { buildMetadata } from "lib/seo";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Catering",
  description:
    "Celjoe Catering — weddings, corporate, birthdays, and private dining. Service-led events planned with intention.",
  path: "/catering",
});

const EVENT_CATEGORIES = [
  {
    title: "Weddings",
    description:
      "Rehearsal dinners, full receptions, late-night kitchen, morning-after brunches.",
  },
  {
    title: "Corporate",
    description:
      "Board meetings, conferences, product launches, hosted dinners, end-of-year parties.",
  },
  {
    title: "Birthdays",
    description:
      "Intimate suppers to larger gatherings — built around the guest of honour.",
  },
  {
    title: "Outdoor",
    description:
      "Garden parties, picnics, and lawn dinners. We bring the kitchen with us.",
  },
  {
    title: "Private Dining",
    description:
      "Reserved evenings at the Smokehouse or in your home. A dedicated chef, your menu.",
  },
  {
    title: "Office Lunch",
    description:
      "Recurring weekly drops for teams. Hot, considered, and on time.",
  },
];

const PACKAGES = [
  {
    name: "Drop",
    description: "Single delivery, ready to serve. Best for office lunches and small gatherings.",
    bullets: ["Plated or family style", "Up to 30 guests", "Setup optional"],
  },
  {
    name: "Hosted",
    description:
      "We bring the chef, the kitchen, and the service. Best for weddings and corporate dinners.",
    bullets: ["Up to 150 guests", "On-site service", "Bespoke menu"],
  },
  {
    name: "Smokehouse",
    description:
      "Our signature live-fire experience at your location. Weekend-only availability.",
    bullets: ["Live fire on-site", "Up to 80 guests", "Pairings included"],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Celjoe didn't just cater our wedding — they hosted it. The team was invisible, the food was unforgettable.",
    attribution: "Tomi & Dara · Lekki",
  },
  {
    quote:
      "We use Celjoe for every product launch. Our guests always ask who's behind the kitchen.",
    attribution: "Lead, a Yaba-based fintech",
  },
];

async function CateringContent() {
  return (
    <>
      <EditorialHero
        eyebrow="Catering"
        title="Service, not just a kitchen"
        description={
          <>
            Catering is hospitality at scale. We plan with you, cook on
            schedule, and run the room so your guests never have to think
            about it.
          </>
        }
        cta={
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Button asChild>
              <Link href="#enquire">Request a quotation</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/kitchen">View the menu</Link>
            </Button>
          </div>
        }
      />

      <Container className="py-[var(--ds-space-16)]">
        <Stack gap="3">
          <Label tone="muted">The Events</Label>
          <SectionTitle>What we cater</SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_CATEGORIES.map((cat) => (
            <article
              key={cat.title}
              className="flex flex-col gap-[var(--ds-space-3)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] transition-[box-shadow] duration-[var(--ds-duration-base)] hover:shadow-[var(--ds-shadow-md)]"
            >
              <Label tone="muted">Event</Label>
              <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                {cat.title}
              </h3>
              <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                {cat.description}
              </p>
            </article>
          ))}
        </div>
      </Container>

      <Container className="py-[var(--ds-space-12)]">
        <Stack gap="3">
          <Label tone="muted">Packages</Label>
          <SectionTitle>How we work</SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-6)] md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className="flex flex-col gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
            >
              <Label tone="muted">Package</Label>
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
          ))}
        </div>
      </Container>

      <EditorialSplit
        eyebrow="Why Celjoe"
        title="One team, end to end"
        body={
          <>
            We don&apos;t sub-contract. The chef who plans your menu is the
            chef who cooks it. That continuity is what makes the difference —
            it&apos;s also why our calendar fills up.
          </>
        }
      />

      <Container className="pb-[var(--ds-space-16)]">
        <Stack gap="3" className="items-center text-center">
          <Label tone="muted">Guests</Label>
          <SectionTitle className="text-center">What they say</SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-6)] md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
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
          <Stack gap="3">
            <Label tone="muted">Quotation</Label>
            <SectionTitle>Request a consultation</SectionTitle>
            <p className="max-w-prose text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              Tell us about the event. We&apos;ll reply with availability,
              suggested menus, and a clear quotation.
            </p>
          </Stack>

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

export default function CateringPage() {
  return (
    <main>
      <Suspense fallback={<CateringSkeleton />}>
        <CateringContent />
      </Suspense>
    </main>
  );
}
