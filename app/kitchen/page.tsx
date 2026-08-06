import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Badge,
  Button,
  Container,
  EditorialSplit,
  EmptyState,
  PageHeader,
  ProductCard,
  SectionTitle,
} from "components/chds";
import { SectionHeading } from "components/shared";
import Footer from "components/layout/footer";
import { kitchenContent } from "lib/content/kitchen";
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
    "Celjoe Kitchen — handcrafted Nigerian meals, cold-pressed juices, chef-curated specials, and wholesome everyday dining delivered fresh in Lagos. Explore today's menu and seasonal picks.",
  path: "/kitchen",
});

export const revalidate = 300;

async function KitchenContent() {
  const [featured, newest, categories, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getNewestProducts(),
    getCategories({ parentId: null }),
    getProducts({ sort: "newest", pagination: { limit: 12 } }),
  ]);

  const { hero, quickFilters, todayMenu, chefsPicks, browseCategories, popularDishes, newArrivals } = kitchenContent;

  return (
    <>
      <PageHeader
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={<>{hero.description}</>}
      />

      <Container className="py-[var(--ds-space-12)]">
        <SectionTitle>{todayMenu.title}</SectionTitle>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          Quick filters
        </p>
        <div
          className="mt-[var(--ds-space-4)] flex flex-wrap gap-[var(--ds-space-2)]"
          role="group"
          aria-label="Quick filters"
        >
          {quickFilters.map((f) => (
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
        eyebrow={chefsPicks.eyebrow}
        title={chefsPicks.title}
        body={<>{chefsPicks.body}</>}
        imageUrl={chefsPicks.image}
        cta={
          <Button asChild>
            <Link href={chefsPicks.cta.href}>{chefsPicks.cta.label}</Link>
          </Button>
        }
      />

      <SectionHeading title={browseCategories.title} className="pb-[var(--ds-space-12)]" />
      <Container className="pb-[var(--ds-space-16)]">
        <div className="grid grid-cols-2 gap-[var(--ds-space-4)] md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/search/${category.slug}`}
              className="group flex flex-col gap-[var(--ds-space-2)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)] transition-[box-shadow,border-color] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:border-[var(--ds-color-accent)] hover:shadow-[var(--ds-shadow-md)]"
            >
              <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Category
              </span>
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

      <SectionHeading
        title={popularDishes.title}
        caption={popularDishes.caption}
        className="pb-[var(--ds-space-12)]"
      />
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
        <div className="flex flex-col items-center gap-[var(--ds-space-3)] text-center">
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {newArrivals.label}
          </span>
          <SectionTitle className="text-center">{newArrivals.title}</SectionTitle>
        </div>
        <div className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((product) => (
            <ProductCard
              key={product.id}
              product={toProductCardModel(product)}
            />
          ))}
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

export default async function KitchenPage() {
  return (
    <main>
      <Suspense fallback={<KitchenSkeleton />}>
        <KitchenContent />
      </Suspense>
    </main>
  );
}
