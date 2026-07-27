import Image from "next/image";
import Link from "next/link";

import {
  Body,
  Button,
  Card,
  CategoryGrid,
  Container,
  EditorialQuote,
  ProductCard,
  Section,
  SectionTitle,
  Stack,
} from "components/chds";
import type { Category } from "lib/supabase/categories";
import type { Product } from "lib/supabase/products";

export function HomeHeroSection({
  headline,
  subheadline,
  imageUrl,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  subheadline?: string | null;
  imageUrl?: string | null;
  primaryCta?: { label: string; href: string } | null;
  secondaryCta?: { label: string; href: string } | null;
}) {
  return (
    <section data-home-hero className="relative overflow-hidden">
      {imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={headline}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[color:var(--ds-color-bg)]/35" />
        </div>
      ) : null}
      <Container className="relative py-[var(--ds-space-16)]">
        <div className="max-w-[72ch]">
          <h1 className="text-[length:var(--ds-text-display)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-display)] tracking-tight text-[var(--ds-color-fg)]">
            {headline}
          </h1>
          {subheadline ? (
            <Body className="mt-[var(--ds-space-4)] text-[var(--ds-color-muted)]">
              {subheadline}
            </Body>
          ) : null}
          {primaryCta || secondaryCta ? (
            <div className="mt-[var(--ds-space-6)] flex flex-wrap gap-[var(--ds-space-3)]">
              {primaryCta ? (
                <Button asChild variant="primary">
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button asChild variant="secondary">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export function HomeProductSection({
  title,
  description,
  products,
}: {
  title: string;
  description?: string | null;
  products: Product[];
}) {
  if (!products.length) return null;

  return (
    <Section>
      <Container>
        <Stack gap="6">
          <div>
            <SectionTitle>{title}</SectionTitle>
            {description ? (
              <Body className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                {description}
              </Body>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] md:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  shortDescription: p.shortDescription,
                  imageUrl: p.images[0]?.url ?? null,
                  imageAlt: p.images[0]?.altText ?? p.name,
                  price: p.price,
                  isAvailable: p.isAvailable,
                  preparationTimeMinutes: p.preparationTimeMinutes,
                }}
              />
            ))}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}

export function HomeCuratedCategoriesSection({
  title,
  description,
  categories,
}: {
  title: string;
  description?: string | null;
  categories: Category[];
}) {
  if (!categories.length) return null;

  return (
    <Section>
      <Container>
        <Stack gap="6">
          <div>
            <SectionTitle>{title}</SectionTitle>
            {description ? (
              <Body className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                {description}
              </Body>
            ) : null}
          </div>
          <CategoryGrid
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              imageUrl: c.image_url,
              description: c.description,
            }))}
          />
        </Stack>
      </Container>
    </Section>
  );
}

export function HomeFeatureSection({
  title,
  description,
  imageUrl,
  cta,
}: {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  cta?: { label: string; href: string } | null;
}) {
  if (!title) return null;

  return (
    <Section>
      <Container>
        <Card variant="editorial" className="overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-[var(--ds-space-8)]">
              <SectionTitle>{title}</SectionTitle>
              {description ? (
                <Body className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                  {description}
                </Body>
              ) : null}
              {cta ? (
                <div className="mt-[var(--ds-space-6)]">
                  <Button asChild variant="primary">
                    <Link href={cta.href}>{cta.label}</Link>
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="relative min-h-[240px] bg-[var(--ds-color-surface-muted)]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}

export function HomeStandardSection({
  title,
  items,
}: {
  title: string;
  items: { title: string; description?: string | null }[];
}) {
  if (!items.length) return null;

  return (
    <Section>
      <Container>
        <Stack gap="6">
          <SectionTitle>{title}</SectionTitle>
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] md:grid-cols-2">
            {items.map((item) => (
              <Card key={item.title} variant="feature">
                <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  {item.title}
                </div>
                {item.description ? (
                  <Body className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                    {item.description}
                  </Body>
                ) : null}
              </Card>
            ))}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}

export function HomeGuestStoriesSection({
  title,
  stories,
}: {
  title: string;
  stories: { quote: string; attribution?: string | null }[];
}) {
  if (!stories.length) return null;

  return (
    <Section>
      <Container>
        <Stack gap="6">
          <SectionTitle>{title}</SectionTitle>
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] md:grid-cols-2">
            {stories.map((story) => (
              <Card key={story.quote} variant="editorial">
                <EditorialQuote>{story.quote}</EditorialQuote>
                {story.attribution ? (
                  <div className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {story.attribution}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}

export function HomeFinalInvitationSection({
  headline,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  primaryCta?: { label: string; href: string } | null;
  secondaryCta?: { label: string; href: string } | null;
}) {
  return (
    <Section className="pb-[var(--ds-space-16)]">
      <Container>
        <Card variant="editorial">
          <Stack gap="6">
            <h2 className="text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-heading)] text-[var(--ds-color-fg)]">
              {headline}
            </h2>
            {primaryCta || secondaryCta ? (
              <div className="flex flex-wrap gap-[var(--ds-space-3)]">
                {primaryCta ? (
                  <Button asChild variant="primary">
                    <Link href={primaryCta.href}>{primaryCta.label}</Link>
                  </Button>
                ) : null}
                {secondaryCta ? (
                  <Button asChild variant="secondary">
                    <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Stack>
        </Card>
      </Container>
    </Section>
  );
}

