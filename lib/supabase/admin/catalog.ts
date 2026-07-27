import { supabase } from "lib/supabase/client";
import { getCategories, type Category } from "lib/supabase/categories";
import { getProducts, type Product } from "lib/supabase/products";

export type AdminProductFilters = {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
};

export type AdminProductList = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  costPerUnit: number;
  supplier: string | null;
  expiry: string | null;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
};

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export async function listAdminProducts(
  filters: AdminProductFilters = {},
): Promise<AdminProductList> {
  const {
    search = "",
    categoryId,
    isAvailable,
    isFeatured,
    page = 1,
    pageSize = 20,
  } = filters;
  const products = await getProducts({
    filters: {
      categoryIds: categoryId ? [categoryId] : undefined,
      featuredOnly: typeof isFeatured === "boolean" ? isFeatured : undefined,
      includeInactive: isAvailable === false ? true : undefined,
    },
    sort: "newest",
    pagination: { limit: pageSize, offset: (page - 1) * pageSize },
  });
  const total = products.length;
  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAdminCategories(): Promise<Category[]> {
  return getCategories();
}

export async function listIngredients(): Promise<Ingredient[]> {
  try {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      name: String(d.name ?? "Unknown"),
      unit: String(d.unit ?? "unit"),
      stock: Number(d.stock ?? 0),
      lowStockThreshold: Number(d.low_stock_threshold ?? 0),
      costPerUnit: Number(d.cost_per_unit ?? 0),
      supplier: (d.supplier as string | null) ?? null,
      expiry: (d.expiry as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function listSuppliers(): Promise<Supplier[]> {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw error;
    }
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      name: String(d.name ?? "Unknown"),
      contact: (d.contact as string | null) ?? null,
      email: (d.email as string | null) ?? null,
      phone: (d.phone as string | null) ?? null,
      active: Boolean(d.active ?? true),
    }));
  } catch {
    return [];
  }
}
