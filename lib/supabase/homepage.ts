import { supabase } from "lib/supabase/client";

export type HomepageSectionType =
  | "hero"
  | "todays_kitchen"
  | "curated_categories"
  | "chefs_table"
  | "smokehouse"
  | "catering"
  | "celjoe_standard"
  | "guest_stories"
  | "final_invitation";

export type HomepageSection = {
  id: string;
  sectionType: HomepageSectionType;
  displayOrder: number;
  isEnabled: boolean;
  content: unknown;
  createdAt: string;
  updatedAt: string;
};

const toHomepageSection = (row: any): HomepageSection => ({
  id: row.id,
  sectionType: row.section_type as HomepageSectionType,
  displayOrder: row.display_order as number,
  isEnabled: row.is_enabled as boolean,
  content: row.content,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export const getHomepageSections = async (): Promise<HomepageSection[]> => {
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("id,section_type,display_order,is_enabled,content,created_at,updated_at")
    .eq("is_enabled", true)
    .order("display_order", { ascending: true });

  if (error) {
    const code = (error as any)?.code as string | undefined;
    if (code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map((row: any) => toHomepageSection(row));
};
