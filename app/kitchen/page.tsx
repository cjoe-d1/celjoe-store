import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Badge,
  Button,
  Container,
  EditorialSplit,
  EmptyState,
  Label,
  PageHeader,
  ProductCard,
  SectionTitle,
  Stack,
} from "components/chds";
import Footer from "components/layout/footer";
import { toProductCardModel } from "lib/product-helpers";
import { buildMetadata } from "lib/seo";
import { getCategories } from "lib/supabase/categories";
import {
  getFeaturedProducts,
  getNewestProducts,
  getProducts,
} from "lib/supabase/products";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "The Kitchen",
  description:
    "The Celjoe Kitchen — today's menu, chef's picks, and the meals our guests return for. Editorial dining, freshly prepared.",
  path: "/kitchen",
});

export const revalidate = 300;

const QUICK_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Lighter", value: "lighter" },
  { label: "Plates", value: "plates" },
  { label: "Bowls", value: "bowls" },
  { label: "Sides", value: "sides" },
  { label: "Drinks", value: "drinks" },
];

async function KitchenContent() {
  const [featured, newest, categories, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getNewestProducts(),
    getCategories({ parentId: null }),
    getProducts({ sort: "newest", pagination: { limit: 12 } }),
  ]);

  const kitchenCategories = categories;

  return (
    <>
      <PageHeader
        eyebrow="Editorial Dining"
        title="The Kitchen"
        description={
          <>
            Today's menu, chef's picks, and the meals our guests return for.
            Every plate is prepared in our kitchen and finished with care.
          </>
        }
      />

      <Container className="py-[var(--ds-space-12)]">
        <SectionTitle>Today's Menu</SectionTitle>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          Quick filters
        </p>
        <div
          className="mt-[var(--ds-space-4)] flex flex-wrap gap-[var(--ds-space-2)]"
          role="group"
          aria-label="Quick filters"
        >
          {QUICK_FILTERS.map((f) => (
            <Badge key={f.value} tone="neutral">
              {f.label}
            </Badge>
          ))}
        </div>
      </Container>

      <Container className="pb-[var(--ds-space-16)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={toProductCardModel(product)} />
          ))}
        </div>
        {featured.length === 0 ? (
          <EmptyState
            title="The kitchen is warming up."
            description="We're preparing today's menu. Please check back shortly."
          />
        ) : null}
      </Container>

      <EditorialSplit
        eyebrow="Chef's Picks"
        title="From the pass, with intent"
        body={
          <>
            Each dish on the Chef's Picks is chosen by our head chef for its
            seasonality, sourcing, and balance. We keep the list short on
            purpose — so the kitchen can focus.
          </>
        }
        imageUrl={null}
        cta={
          <Button asChild>
            <Link href="/search">Browse the full menu</Link>
          </Button>
        }
      />

      <Container className="pb-[var(--ds-space-12)]">
        <SectionTitle>Browse by Category</SectionTitle>
      </Container>
      <Container className="pb-[var(--ds-space-16)]">
        <div className="grid grid-cols-2 gap-[var(--ds-space-4)] md:grid-cols-3 lg:grid-cols-4">
          {kitchenCategories.map((category) => (
            <Link
              key={category.id}
              href={`/search/${category.slug}`}
              className="group flex flex-col gap-[var(--ds-space-2)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)] transition-[box-shadow,border-color] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:border-[var(--ds-color-accent)] hover:shadow-[var(--ds-shadow-md)]"
            >
              <Label tone="muted">Category</Label>
              <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                {category.name}
              </div>
              <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)] underline-offset-4 group-hover:underline">
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="pb-[var(--ds-space-12)]">
        <SectionTitle>Popular dishes</SectionTitle>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          What our guests return for, again and again.
        </p>
      </Container>
      <Container className="pb-[var(--ds-space-16)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-4">
          {allProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={toProductCardModel(product)}
            />
          ))}
        </div>
      </Container>

      <Container className="pb-[var(--ds-space-16)]">
        <Stack gap="3" className="items-center text-center">
          <Label tone="muted">Recently added</Label>
          <SectionTitle className="text-center">
            New on the menu
          </SectionTitle>
        </Stack>
        <div className="mt-[var(--ds-space-8)]">
          <div className="grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-4">
            {newest.map((product) => (
              <ProductCard
                key={product.id}
                product={toProductCardModel(product)}
              />
            ))}
          </div>
        </div>
      </Container>

      <Footer />
    </>
  );
}

function KitchenSkeleton() {
  return (
    <Container className="py-[var(--ds-space-16)]">
      <div className="h-[2px] w-full animate-pulse bg-[var(--ds-color-surface-muted)]" />
    </Container>
  );
}

export default function KitchenPage() {
  return (
    <main>
      <Suspense fallback={<KitchenSkeleton />}>
        <KitchenContent />
      </Suspense>
    </main>
  );
}
