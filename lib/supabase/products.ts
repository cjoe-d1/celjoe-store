import { supabase } from "lib/supabase/client";

export type CurrencyCode = string;

export type Money = {
  amount: string;
  currencyCode: CurrencyCode;
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
};

export type ProductVariantOption = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  price: Money | null;
  stockQuantity: number;
  optionValues: ProductVariantOption[];
  isAvailable: boolean;
};

export type ProductOptionGroup = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: Money;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTimeMinutes: number | null;
  stockQuantity: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category: ProductCategory | null;
  images: ProductImage[];
  variants: ProductVariant[];
  optionGroups: ProductOptionGroup[];
};

export type ProductSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export type ProductFilters = {
  includeInactive?: boolean;
  featuredOnly?: boolean;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  tag?: string;
};

export type Pagination = {
  limit?: number;
  offset?: number;
};

const DEFAULT_CURRENCY_CODE: CurrencyCode = "USD";
const DEFAULT_LIMIT = 24;

type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

type DbImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
};

type DbVariant = {
  id: string;
  name: string;
  price: number | null;
  stock_quantity: number;
  option_values: unknown;
};

type DbProduct = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  preparation_minutes: number;
  stock_quantity: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  category?: DbCategory | null;
  images?: DbImage[] | null;
  variants?: DbVariant[] | null;
};

const money = (amount: number | null, currencyCode = DEFAULT_CURRENCY_CODE): Money | null => {
  if (amount === null) return null;
  return { amount: amount.toFixed(2), currencyCode };
};

const parseOptionValues = (value: unknown): ProductVariantOption[] => {
  if (!Array.isArray(value)) return [];
  const items = value
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const name = (v as any).name;
      const optionValue = (v as any).value;
      if (typeof name !== "string" || typeof optionValue !== "string") return null;
      return { name, value: optionValue } satisfies ProductVariantOption;
    })
    .filter(Boolean) as ProductVariantOption[];

  return items;
};

const buildOptionGroups = (variants: ProductVariant[]): ProductOptionGroup[] => {
  const map = new Map<string, Set<string>>();

  for (const variant of variants) {
    for (const option of variant.optionValues) {
      const key = option.name;
      const set = map.get(key) ?? new Set<string>();
      set.add(option.value);
      map.set(key, set);
    }
  }

  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values.values()),
  }));
};

const toProduct = (row: DbProduct, currencyCode = DEFAULT_CURRENCY_CODE): Product => {
  const variants: ProductVariant[] = (row.variants ?? []).map((v) => {
    const optionValues = parseOptionValues(v.option_values);
    const isAvailable = v.stock_quantity > 0;
    return {
      id: v.id,
      productId: row.id,
      name: v.name,
      price: money(v.price, currencyCode),
      stockQuantity: v.stock_quantity,
      optionValues,
      isAvailable,
    };
  });

  const images: ProductImage[] = (row.images ?? [])
    .map((img) => ({
      id: img.id,
      url: img.image_url,
      altText: img.alt_text,
      displayOrder: img.display_order,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    price: money(row.price, currencyCode)!,
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    preparationTimeMinutes: row.preparation_minutes,
    stockQuantity: row.stock_quantity,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
          parentId: row.category.parent_id,
        }
      : null,
    images,
    variants,
    optionGroups: buildOptionGroups(variants),
  };
};

const applySorting = <T extends ReturnType<typeof supabase.from>>(
  query: any,
  sort: ProductSort,
) => {
  switch (sort) {
    case "price_asc":
      return query.order("price", { ascending: true }).order("created_at", { ascending: false });
    case "price_desc":
      return query.order("price", { ascending: false }).order("created_at", { ascending: false });
    case "name_asc":
      return query.order("name", { ascending: true });
    case "name_desc":
      return query.order("name", { ascending: false });
    case "newest":
      return query.order("created_at", { ascending: false });
    case "relevance":
    default:
      return query.order("created_at", { ascending: false });
  }
};

const applyPagination = (query: any, pagination?: Pagination) => {
  const limit = pagination?.limit ?? DEFAULT_LIMIT;
  const offset = pagination?.offset ?? 0;
  return query.range(offset, offset + limit - 1);
};

const baseSelect =
  "id,category_id,name,slug,description,short_description,price,is_available,is_featured,preparation_minutes,stock_quantity,tags,created_at,updated_at,category:categories!products_category_fk(id,name,slug,parent_id),images:product_images(id,image_url,alt_text,display_order),variants:product_variants(id,name,price,stock_quantity,option_values)";

export const getProducts = async (options?: {
  filters?: ProductFilters;
  sort?: ProductSort;
  pagination?: Pagination;
}): Promise<Product[]> => {
  const sort = options?.sort ?? "newest";
  const includeInactive = options?.filters?.includeInactive ?? false;
  const featuredOnly = options?.filters?.featuredOnly ?? false;

  let query = supabase.from("products").select(baseSelect);

  if (!includeInactive) query = query.eq("is_available", true);
  if (featuredOnly) query = query.eq("is_featured", true);

  if (options?.filters?.categoryIds?.length) {
    query = query.in("category_id", options.filters.categoryIds);
  }

  if (options?.filters?.minPrice !== undefined) {
    query = query.gte("price", options.filters.minPrice);
  }

  if (options?.filters?.maxPrice !== undefined) {
    query = query.lte("price", options.filters.maxPrice);
  }

  if (options?.filters?.tag) {
    query = query.contains("tags", [options.filters.tag]);
  }

  query = applySorting(query, sort);
  query = applyPagination(query, options?.pagination);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => toProduct(row as DbProduct));
};

export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("products")
    .select(baseSelect)
    .in("id", ids);

  if (error) throw error;
  return (data ?? []).map((row: any) => toProduct(row as DbProduct));
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select(baseSelect)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toProduct(data as any as DbProduct);
};

export const getFeaturedProducts = async (options?: {
  pagination?: Pagination;
}): Promise<Product[]> => {
  return getProducts({
    filters: { featuredOnly: true },
    sort: "newest",
    pagination: options?.pagination,
  });
};

export const getNewestProducts = async (options?: {
  pagination?: Pagination;
}): Promise<Product[]> => {
  return getProducts({ sort: "newest", pagination: options?.pagination });
};

export const getProductsByTag = async (
  tag: string,
  options?: { pagination?: Pagination; sort?: ProductSort },
): Promise<Product[]> => {
  return getProducts({
    filters: { tag },
    sort: options?.sort ?? "newest",
    pagination: options?.pagination,
  });
};

export const getProductsByCategory = async (
  categorySlug: string,
  options?: { pagination?: Pagination; sort?: ProductSort },
): Promise<Product[]> => {
  const { data: categoryIds, error: categoryIdsError } = await supabase.rpc(
    "get_category_descendant_ids",
    { root_slug: categorySlug },
  );

  if (categoryIdsError) throw categoryIdsError;

  const ids = ((categoryIds ?? []) as any[]).map((r) => r.id).filter(Boolean);
  if (!ids.length) return [];

  return getProducts({
    filters: { categoryIds: ids },
    sort: options?.sort ?? "newest",
    pagination: options?.pagination,
  });
};

export const searchProducts = async (
  queryText: string,
  options?: { pagination?: Pagination; sort?: ProductSort },
): Promise<Product[]> => {
  const q = queryText.trim();
  if (!q) return getProducts({ pagination: options?.pagination, sort: options?.sort });

  const pagination = options?.pagination;
  const sort = options?.sort ?? "relevance";

  let query = supabase
    .from("products")
    .select(baseSelect)
    .eq("is_available", true)
    .textSearch("search_vector", q, { type: "websearch", config: "simple" });

  query = applySorting(query, sort);
  query = applyPagination(query, pagination);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => toProduct(row as DbProduct));
};

export const getRelatedProducts = async (
  productId: string,
  options?: { limit?: number },
): Promise<Product[]> => {
  const limit = options?.limit ?? 10;

  const { data: base, error: baseError } = await supabase
    .from("products")
    .select("id,category_id,tags")
    .eq("id", productId)
    .limit(1)
    .maybeSingle();

  if (baseError) throw baseError;
  if (!base) return [];

  const tags = (base.tags ?? []) as string[];
  const categoryId = base.category_id as string;

  let query = supabase
    .from("products")
    .select(baseSelect)
    .eq("is_available", true)
    .neq("id", productId)
    .limit(limit);

  if (tags.length) {
    query = query.contains("tags", [tags[0]]);
  } else {
    query = query.eq("category_id", categoryId);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => toProduct(row as DbProduct));
};
