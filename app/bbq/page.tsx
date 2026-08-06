import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Button,
  Container,
  EditorialSplit,
  ProductCard,
} from "components/chds";
import { EditorialHero } from "components/chds/page-sections";
import { ContentSection, SectionHeading, CTASection } from "components/shared";
import Footer from "components/layout/footer";
import { bbqContent } from "lib/content/bbq";
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

  const { hero, philosophy, craft, featuredPlatters, pairings, cta } = bbqContent;

  return (
    <>
      <EditorialHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={<>{hero.description}</>}
        imageUrl={hero.image}
        tone="dark"
        cta={
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Button variant="primary" asChild>
              <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
            </Button>
            <Button
              variant="ghost"
              className="border border-[#E6B266] text-[#F6F1EA] hover:bg-[#1B1614]"
              asChild
            >
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
        }
      />

      <ContentSection label={philosophy.label} title={philosophy.title} className="py-[var(--ds-space-16)]">
        <p>{philosophy.body}</p>
      </ContentSection>

      <EditorialSplit
        eyebrow={craft.eyebrow}
        title={craft.title}
        body={<>{craft.body}</>}
        imageUrl={craft.image}
        reverse
      />

      <SectionHeading
        title={featuredPlatters.title}
        caption={featuredPlatters.caption}
        className="pb-[var(--ds-space-12)]"
      />
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
        eyebrow={pairings.eyebrow}
        title={pairings.title}
        body={<>{pairings.body}</>}
        imageUrl={pairings.image}
      />

      <CTASection
        label={cta.label}
        title={cta.title}
        description={cta.description}
        primaryCta={cta.primaryCta}
        secondaryCta={cta.secondaryCta}
        backgroundImage={cta.backgroundImage}
      />

      <Footer />
    </>
  );
}

function SmokehouseSkeleton() {
  return (
    <div className="h-[60vh] w-full animate-pulse bg-[#14110F]" aria-hidden />
  );
}

export default async function SmokehousePage() {
  return (
    <main data-theme="smokehouse">
      <Suspense fallback={<SmokehouseSkeleton />}>
        <SmokehouseContent />
      </Suspense>
    </main>
  );
}
