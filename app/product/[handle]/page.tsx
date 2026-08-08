import {
  Badge,
  Button,
  Container,
  Label,
  ProductCard,
  ProductGallery,
  ProductMeta,
  RelatedProductsShell,
} from "components/chds";
import Footer from "components/layout/footer";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { toProductCardModel } from "lib/product-helpers";
import { buildMetadata, productJsonLd, breadcrumbJsonLd, renderJsonLd } from "lib/seo";
import { getProductBySlug, getRelatedProducts } from "lib/supabase/products";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductInteractive } from "./product-interactive";

export const dynamic = "force-dynamic";

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

  const productJsonLdData = productJsonLd({
    name: product.name,
    description: product.description,
    image: product.images[0]?.url,
    price: Number(product.price.amount),
    currency: product.price.currencyCode,
    isAvailable: product.isAvailable,
    url: `/product/${product.slug}`,
  });

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Kitchen", href: "/kitchen" },
    ...(product.category
      ? [{ name: product.category.name, href: `/search/${product.category.slug}` }]
      : []),
    { name: product.name, href: `/product/${product.slug}` },
  ]);

  const images = product.images;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(productJsonLdData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(breadcrumbLd),
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
          <div id="celjoe-product-image" className="h-full w-full basis-full lg:basis-3/5">
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
                {product.isFeatured ? <Badge tone="accent">Chef&apos;s Pick</Badge> : null}
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
        <div className="flex justify-center">
          <aside className="w-full max-w-[320px]">
            <div className="sticky top-[var(--ds-space-24)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-sm)]">
              <Label tone="muted">Quick add</Label>
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
