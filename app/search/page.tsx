import type { Metadata } from "next";

import {
  Container,
  EmptyState,
  Label,
  PageHeader,
  ProductCard,
  SearchBar,
  SectionTitle,
  Stack,
} from "components/chds";
import Footer from "components/layout/footer";
import { toProductCardModel } from "lib/product-helpers";
import { buildMetadata } from "lib/seo";
import { siteConfig } from "lib/site-config";
import { getCategories } from "lib/supabase/categories";
import { defaultSort, sorting } from "lib/constants";
import {
  getFeaturedProducts,
  getNewestProducts,
  getProducts,
  searchProducts,
} from "lib/supabase/products";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description:
    "Search the Celjoe kitchen. Find meals, sides, drinks, and Smokehouse specials.",
  path: "/search",
});

const TRENDING = [
  "Jollof Rice",
  "Smokehouse Platter",
  "Peppered Snail",
  "Chapman",
  "Moi Moi",
  "Plantain Bowl",
];

const toProductSort = (
  sortKey: string,
  reverse: boolean,
  hasQuery: boolean,
):
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc" => {
  if (hasQuery && sortKey === "RELEVANCE") return "relevance";

  if (sortKey === "PRICE") return reverse ? "price_desc" : "price_asc";
  if (sortKey === "CREATED_AT") return "newest";
  if (sortKey === "BEST_SELLING") return "newest";

  return "newest";
};

type SearchParams = {
  sort?: string;
  q?: string;
};

export default async function SearchPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await props.searchParams) ?? {};
  const searchValue = (sp.q ?? "").trim();
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sp.sort) || defaultSort;

  const [products, categories, trending, newest] = await Promise.all([
    searchValue
      ? searchProducts(searchValue, {
          sort: toProductSort(sortKey, reverse, true),
        })
      : getProducts({ sort: toProductSort(sortKey, reverse, false) }),
    getCategories({ parentId: null }),
    getFeaturedProducts(),
    getNewestProducts(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={searchValue ? `Results for "${searchValue}"` : "Find a meal"}
        description={
          searchValue
            ? `${products.length} match${products.length === 1 ? "" : "es"} in the kitchen.`
            : "Search the kitchen by name, ingredient, or mood."
        }
      />

      <Container className="py-[var(--ds-space-8)]">
        <SearchBar placeholder="Search the kitchen..." />
      </Container>

      {!searchValue ? (
        <>
          <Container className="pb-[var(--ds-space-8)]">
            <Stack gap="3">
              <Label tone="muted">Trending</Label>
              <div className="flex flex-wrap gap-[var(--ds-space-2)]">
                {TRENDING.map((t) => (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)] transition-colors hover:border-[var(--ds-color-accent)] hover:text-[var(--ds-color-accent)]"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </Stack>
          </Container>

          <Container className="pb-[var(--ds-space-12)]">
            <Stack gap="3">
              <Label tone="muted">Categories</Label>
              <SectionTitle>Browse by category</SectionTitle>
            </Stack>
            <div className="mt-[var(--ds-space-6)] grid grid-cols-2 gap-[var(--ds-space-3)] md:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/search/${c.slug}`}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-4)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] transition-colors hover:border-[var(--ds-color-accent)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </Container>

          <Container className="pb-[var(--ds-space-12)]">
            <Stack gap="3">
              <Label tone="muted">Newly added</Label>
              <SectionTitle>Recently added</SectionTitle>
            </Stack>
            <div className="mt-[var(--ds-space-6)] grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-4">
              {newest.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={toProductCardModel(p)} />
              ))}
            </div>
          </Container>

          <Container className="pb-[var(--ds-space-16)]">
            <Stack gap="3">
              <Label tone="muted">Suggestions</Label>
              <SectionTitle>You might like</SectionTitle>
            </Stack>
            <div className="mt-[var(--ds-space-6)] grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-4">
              {trending.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={toProductCardModel(p)} />
              ))}
            </div>
          </Container>
        </>
      ) : products.length === 0 ? (
        <Container className="pb-[var(--ds-space-16)]">
          <EmptyState
            title="No results found"
            description={`We couldn't find anything in the kitchen for "${searchValue}". Try a different phrase, or browse the categories below.`}
          />
          <div className="mt-[var(--ds-space-8)]">
            <SectionTitle>Browse by category</SectionTitle>
            <div className="mt-[var(--ds-space-4)] grid grid-cols-2 gap-[var(--ds-space-3)] md:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/search/${c.slug}`}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-4)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] transition-colors hover:border-[var(--ds-color-accent)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      ) : (
        <Container className="pb-[var(--ds-space-16)]">
          <div className="grid grid-cols-1 gap-[var(--ds-space-6)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={toProductCardModel(p)} />
            ))}
          </div>
        </Container>
      )}

      <Footer />
    </>
  );
}
