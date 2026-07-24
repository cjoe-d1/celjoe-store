import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProducts, searchProducts } from "lib/supabase/products";

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
  if (sortKey === "CREATED_AT") return reverse ? "newest" : "newest";
  if (sortKey === "BEST_SELLING") return "newest";

  return "newest";
};

export const metadata = {
  title: "Search",
  description: "Search for products in the store.",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const products = searchValue
    ? await searchProducts(searchValue, {
        sort: toProductSort(sortKey, reverse, true),
      })
    : await getProducts({ sort: toProductSort(sortKey, reverse, false) });
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <>
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0
            ? "There are no products that match "
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : null}
    </>
  );
}
