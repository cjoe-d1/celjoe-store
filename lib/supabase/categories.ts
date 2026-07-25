import { supabase } from "lib/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryNode = Category & { children: CategoryNode[] };

type CategoryRow = Category;

const toCategoryNodeTree = (categories: CategoryRow[]): CategoryNode[] => {
  const byId = new Map<string, CategoryNode>(
    categories.map((c) => [c.id, { ...c, children: [] }]),
  );

  const roots: CategoryNode[] = [];

  for (const category of byId.values()) {
    if (category.parent_id) {
      const parent = byId.get(category.parent_id);
      if (parent) parent.children.push(category);
      else roots.push(category);
      continue;
    }

    roots.push(category);
  }

  const sortTree = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortTree(n.children));
  };

  sortTree(roots);

  return roots;
};

export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id,name,slug,description,image_url,parent_id,display_order,is_active,created_at,updated_at",
    )
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getCategories = async (options?: {
  parentId?: string | null;
  includeInactive?: boolean;
}): Promise<Category[]> => {
  const parentId =
    options?.parentId === undefined ? null : (options.parentId ?? null);
  const includeInactive = options?.includeInactive ?? false;

  let query = supabase
    .from("categories")
    .select(
      "id,name,slug,description,image_url,parent_id,display_order,is_active,created_at,updated_at",
    )
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  query = parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);
  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
};

export const getSubcategories = async (parentId: string): Promise<Category[]> => {
  return getCategories({ parentId });
};

export const getCategoryTree = async (options?: {
  includeInactive?: boolean;
}): Promise<CategoryNode[]> => {
  const includeInactive = options?.includeInactive ?? false;

  let query = supabase
    .from("categories")
    .select(
      "id,name,slug,description,image_url,parent_id,display_order,is_active,created_at,updated_at",
    );

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;

  return toCategoryNodeTree(data ?? []);
};

export const getCategoriesByIds = async (ids: string[], options?: { includeInactive?: boolean }) => {
  if (!ids.length) return [];

  const includeInactive = options?.includeInactive ?? false;

  let query = supabase
    .from("categories")
    .select(
      "id,name,slug,description,image_url,parent_id,display_order,is_active,created_at,updated_at",
    )
    .in("id", ids);

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;

  const byId = new Map((data ?? []).map((c: any) => [c.id as string, c as Category]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Category[];
};
