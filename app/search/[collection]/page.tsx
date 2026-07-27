import { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "components/chds";
import { defaultSort, sorting } from "lib/constants";
import { getCategoryBySlug } from "lib/supabase/categories";
import { getProductsByCategory } from "lib/supabase/products";

const toProductSort = (
  sortKey: string,
  reverse: boolean,
): "newest" | "price_asc" | "price_desc" => {
  if (sortKey === "PRICE") return reverse ? "price_desc" : "price_asc";
  return "newest";
};

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const category = await getCategoryBySlug(params.collection);

  if (!category) return notFound();

  return {
    title: category.name,
    description:
      category.description || `${category.name} products`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getProductsByCategory(params.collection, {
    sort: toProductSort(sortKey, reverse),
  });

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                shortDescription: product.shortDescription,
                imageUrl: product.images[0]?.url ?? null,
                imageAlt: product.images[0]?.altText ?? product.name,
                price: product.price,
                isAvailable: product.isAvailable,
                preparationTimeMinutes: product.preparationTimeMinutes,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
