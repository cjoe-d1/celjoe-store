import { Metadata } from "next";
import { notFound } from "next/navigation";

import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
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
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
