import {
  AvailabilityBadge,
  Badge,
  Button,
  Container,
  EditorialQuote,
  Label,
  PreparationTime,
  PriceDisplay,
  ProductCard,
  ProductGallery,
  ProductMeta,
  RelatedProductsShell,
  SectionTitle,
  Stack,
} from "components/chds";
import Footer from "components/layout/footer";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { toProductCardModel } from "lib/product-helpers";
import { buildMetadata } from "lib/seo";
import { getProductBySlug, getRelatedProducts } from "lib/supabase/products";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductInteractive } from "./product-interactive";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.handle);

  if (!product) return buildMetadata({ title: "Not found", noIndex: true });

  const url = product.images[0]?.url;
  const alt = product.images[0]?.altText ?? product.name;
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return buildMetadata({
    title: product.name,
    description: product.shortDescription || product.description || undefined,
    path: `/product/${product.slug}`,
    image: url ?? undefined,
    noIndex: !indexable,
  });
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProductBySlug(params.handle);

  if (!product) return notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images[0]?.url,
    offers: {
      "@type": "AggregateOffer",
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.price.currencyCode,
      highPrice: product.price.amount,
      lowPrice: product.price.amount,
    },
  };

  const images = product.images;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />

      <Container className="pt-[var(--ds-space-8)]">
        <nav aria-label="Breadcrumb" className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          <ol className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <li>
              <Link href="/" className="hover:text-[var(--ds-color-fg)]">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/kitchen" className="hover:text-[var(--ds-color-fg)]">Kitchen</Link>
            </li>
            {product.category ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href={`/search/${product.category.slug}`}
                    className="hover:text-[var(--ds-color-fg)]"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden>/</li>
            <li className="text-[var(--ds-color-fg)]">{product.name}</li>
          </ol>
        </nav>
      </Container>

      <div className="mx-auto mt-[var(--ds-space-6)] max-w-(--breakpoint-2xl) px-4">
        <div className="flex flex-col rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-sm)] md:p-[var(--ds-space-10)] lg:flex-row lg:gap-[var(--ds-space-10)]">
          <div className="h-full w-full basis-full lg:basis-3/5">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[600px] w-full overflow-hidden rounded-[var(--ds-radius-xl)] bg-[var(--ds-color-surface-muted)]" />
              }
            >
              <ProductGallery
                images={images.slice(0, 5).map((image) => ({
                  src: image.url,
                  alt: image.altText ?? product.name,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/5">
            <div className="flex flex-col gap-[var(--ds-space-3)] border-b border-[var(--ds-color-border)] pb-[var(--ds-space-6)]">
              {product.category ? (
                <Label tone="muted">{product.category.name}</Label>
              ) : null}
              <h1 className="text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-display)] tracking-tight text-[var(--ds-color-fg)]">
                {product.name}
              </h1>
              {product.shortDescription ? (
                <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                  {product.shortDescription}
                </p>
              ) : null}
              <div className="mt-[var(--ds-space-3)] flex flex-wrap items-center gap-[var(--ds-space-3)]">
                <AvailabilityBadge available={product.isAvailable} />
                {product.preparationTimeMinutes ? (
                  <PreparationTime minutes={product.preparationTimeMinutes} />
                ) : null}
                {product.isFeatured ? <Badge tone="accent">Chef&apos;s Pick</Badge> : null}
              </div>
              <div className="mt-[var(--ds-space-4)]">
                <PriceDisplay
                  amount={product.price.amount}
                  currencyCode={product.price.currencyCode}
                />
              </div>
            </div>

            {product.description ? (
              <div className="mt-[var(--ds-space-6)] text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
                {product.description}
              </div>
            ) : null}

            <div className="mt-[var(--ds-space-6)]">
              <Suspense fallback={null}>
                <ProductInteractive product={product} />
              </Suspense>
            </div>

            <div className="mt-[var(--ds-space-8)]">
              <ProductMeta
                rows={[
                  ...(product.category ? [{ label: "Category", value: product.category.name }] : []),
                  ...(product.tags.length ? [{ label: "Tags", value: product.tags.join(", ") }] : []),
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <Container className="py-[var(--ds-space-16)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-12)] lg:grid-cols-[1fr_320px]">
          <Stack gap="10">
            <section aria-labelledby="ingredients">
              <Stack gap="3">
                <Label tone="muted">Ingredients</Label>
                <SectionTitle>What's inside</SectionTitle>
                <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                  We source what we can name, and we tell you where it came from.
                </p>
              </Stack>
              <ul className="mt-[var(--ds-space-6)] grid grid-cols-1 gap-[var(--ds-space-2)] sm:grid-cols-2">
                {[
                  "Long-grain rice, sourced from a local mill",
                  "Red bell peppers, plum tomatoes, scotch bonnets",
                  "Onion, garlic, ginger, thyme, bay leaf",
                  "House-made chicken stock",
                  "Cold-pressed palm oil",
                  "Sea salt, freshly cracked black pepper",
                ].map((ing) => (
                  <li
                    key={ing}
                    className="flex items-start gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
                  >
                    <span aria-hidden className="mt-[6px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ds-color-accent)]" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="preparation">
              <Stack gap="3">
                <Label tone="muted">Preparation</Label>
                <SectionTitle>How it&apos;s made</SectionTitle>
              </Stack>
              <ol className="mt-[var(--ds-space-6)] space-y-[var(--ds-space-4)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                <li>
                  <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">1 · Par-cook the rice.</span>{" "}
                  The grain is par-cooked in salted water until just underdone, then rested.
                </li>
                <li>
                  <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">2 · Build the base.</span>{" "}
                  The pepper mix is fried slowly in palm oil for 30+ minutes until the
                  oils split. This is the colour, and the flavour.
                </li>
                <li>
                  <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">3 · Steam together.</span>{" "}
                  The rice and base are combined and steamed, low and slow, until the
                  bottom sets into a socarrat.
                </li>
                <li>
                  <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">4 · Plate to order.</span>{" "}
                  Each portion is finished in a hot pan and plated just before it leaves the kitchen.
                </li>
              </ol>
            </section>

            <section aria-labelledby="nutrition">
              <Stack gap="3">
                <Label tone="muted">Nutrition &amp; allergens</Label>
                <SectionTitle>What to know</SectionTitle>
              </Stack>
              <div className="mt-[var(--ds-space-6)] grid grid-cols-2 gap-[var(--ds-space-3)] sm:grid-cols-4">
                {[
                  { k: "Energy", v: "—" },
                  { k: "Protein", v: "—" },
                  { k: "Carbs", v: "—" },
                  { k: "Allergens", v: "Gluten" },
                ].map((m) => (
                  <div
                    key={m.k}
                    className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-4)]"
                  >
                    <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                      {m.k}
                    </div>
                    <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                      {m.v}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Full nutrition and allergen details will be available once our kitchen completes the audit.
              </p>
            </section>

            <section aria-labelledby="reviews">
              <Stack gap="3">
                <Label tone="muted">Guests</Label>
                <SectionTitle>Reviews</SectionTitle>
              </Stack>
              <EditorialQuote className="mt-[var(--ds-space-6)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
                <p className="text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-fg)]">
                  &ldquo;The kind of meal you finish and immediately want to order again.
                  You can taste the patience in it.&rdquo;
                </p>
                <footer className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  — A returning guest
                </footer>
              </EditorialQuote>
              <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Verified guest reviews land once our review programme is live.
              </p>
            </section>
          </Stack>

          <aside className="hidden lg:block">
            <div className="sticky top-[var(--ds-space-24)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-sm)]">
              <Label tone="muted">Quick add</Label>
              <div className="mt-[var(--ds-space-3)] flex items-center justify-between">
                <PriceDisplay
                  amount={product.price.amount}
                  currencyCode={product.price.currencyCode}
                />
                <AvailabilityBadge available={product.isAvailable} />
              </div>
              <div className="mt-[var(--ds-space-4)]">
                <Suspense fallback={null}>
                  <ProductInteractive product={product} />
                </Suspense>
              </div>
              <p className="mt-[var(--ds-space-4)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Your order is prepared in small batches. Allow{" "}
                {product.preparationTimeMinutes ?? 30} minutes from confirmation.
              </p>
              <Button asChild variant="ghost" className="mt-[var(--ds-space-4)] w-full">
                <Link href="/cart">Go to cart</Link>
              </Button>
            </div>
          </aside>
        </div>
      </Container>

      <Container className="pb-[var(--ds-space-16)]">
        <RelatedProducts id={product.id} />
      </Container>

      <Footer />
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getRelatedProducts(id);

  if (!relatedProducts.length) {
    return null;
  }

  return (
    <RelatedProductsShell>
      {relatedProducts.map((product) => (
        <div key={product.id} className="min-w-[260px] shrink-0 md:w-1/3 lg:w-1/4">
          <ProductCard product={toProductCardModel(product)} />
        </div>
      ))}
    </RelatedProductsShell>
  );
}
