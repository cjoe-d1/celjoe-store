import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Button,
  Container,
  EditorialSplit,
  Label,
  ProductCard,
  SectionTitle,
  Stack,
} from "components/chds";
import { EditorialHero } from "components/chds/page-sections";
import Footer from "components/layout/footer";
import { toProductCardModel } from "lib/product-helpers";
import { buildMetadata } from "lib/seo";
import { getCategories } from "lib/supabase/categories";
import { getProducts } from "lib/supabase/products";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "The Smokehouse",
  description:
    "Fire-kissed flavours from the Celjoe Smokehouse. Slow-smoked proteins, weekend specials, and our signature weekend platters.",
  path: "/bbq",
});

export const revalidate = 300;

async function SmokehouseContent() {
  // Try to fetch the "smokehouse" category if it exists.
  // Falls back to featured products if the category is not yet seeded.
  const allCategories = await getCategories().catch(() => []);
  const category = allCategories.find((c) => c.slug === "smokehouse") ?? null;
  const categoryProducts = category
    ? await getProducts({
        filters: { categoryIds: [category.id] },
        sort: "newest",
        pagination: { limit: 12 },
      })
    : [];

  const featured = categoryProducts.length > 0
    ? categoryProducts
    : (await getProducts({ filters: { featuredOnly: true }, pagination: { limit: 8 } }));

  return (
    <>
      <EditorialHero
        eyebrow="The Smokehouse"
        title="Fire. Time. Craft."
        description={
          <>
            The Smokehouse is Celjoe&apos;s signature experience — slow, deliberate,
            built around live fire and patience. Weekend platters, char-kissed
            proteins, and sides worth the detour.
          </>
        }
        tone="dark"
        cta={
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Button variant="primary" asChild>
              <Link href="#smokehouse-menu">View the menu</Link>
            </Button>
            <Button
              variant="ghost"
              className="border border-[#E6B266] text-[#F6F1EA] hover:bg-[#1B1614]"
              asChild
            >
              <Link href="/catering">Book the Smokehouse</Link>
            </Button>
          </div>
        }
      />

      <Container className="py-[var(--ds-space-16)]">
        <Stack gap="3">
          <Label tone="muted">The Philosophy</Label>
          <SectionTitle>Built on patience</SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-6)] max-w-prose text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
          <p>
            We don&apos;t rush fire. Every cut rests in our rub for hours before
            it ever meets the grill. The result is honest smoke, rendered fat,
            and a bark that tells you exactly what you&apos;re eating.
          </p>
        </div>
      </Container>

      <EditorialSplit
        eyebrow="The Craft"
        title="Smoke, low and slow"
        body={
          <>
            Oura is offset-fired hardwood. We cook by feel, not by timer. The
            crust forms; the inside stays tender. It&apos;s the kind of
            cooking that asks for your attention — and earns it.
          </>
        }
        imageUrl={null}
        reverse
      />

      <Container className="pb-[var(--ds-space-12)]" id="smokehouse-menu">
        <Stack gap="3">
          <Label tone="muted">The Platter</Label>
          <SectionTitle>Featured platters</SectionTitle>
        </Stack>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          Weekend specials, rotating sides, and pairings picked by the chef.
        </p>
      </Container>
      <Container className="pb-[var(--ds-space-16)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={toProductCardModel(product)}
            />
          ))}
        </div>
      </Container>

      <EditorialSplit
        eyebrow="Pairings"
        title="What to drink alongside"
        body={
          <>
            A smoky platter wants something cool and confident. Our pairings
            editor has done the work — soft citrus, cold sparkling water, and
            a few house-made options to round the meal.
          </>
        }
        imageUrl={null}
      />

      <Container className="pb-[var(--ds-space-16)]">
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-10)] md:p-[var(--ds-space-16)]">
          <Stack gap="4" className="items-center text-center">
            <Label tone="muted">The Smokehouse CTA</Label>
            <SectionTitle className="text-center">
              Reserve the weekend
            </SectionTitle>
            <p className="max-w-prose text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
              Weekend platters are prepared in limited batches. Reserve early,
              or book the full Smokehouse experience for an event.
            </p>
            <div className="flex flex-wrap justify-center gap-[var(--ds-space-3)] pt-[var(--ds-space-2)]">
              <Button asChild>
                <Link href="/catering">Plan an event</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/kitchen">Back to the kitchen</Link>
              </Button>
            </div>
          </Stack>
        </div>
      </Container>

      <Footer />
    </>
  );
}

function SmokehouseSkeleton() {
  return (
    <div className="h-[60vh] w-full animate-pulse bg-[#14110F]" aria-hidden />
  );
}

export default function SmokehousePage() {
  return (
    <main data-theme="smokehouse">
      <Suspense fallback={<SmokehouseSkeleton />}>
        <SmokehouseContent />
      </Suspense>
    </main>
  );
}
