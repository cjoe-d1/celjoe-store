import { db } from "lib/supabase/admin";
import type { QuotationRow, QuotationStatus } from "lib/supabase/quotations";

export type { QuotationRow, QuotationStatus };

export type QuotationListResult = {
  quotations: QuotationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListQuotationsParams = {
  status?: QuotationStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Admin: list quotations with optional status filter and search.
 */
export async function listQuotations(
  params: ListQuotationsParams = {},
): Promise<QuotationListResult> {
  const status = params.status ?? "all";
  const search = params.search ?? "";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  let query = db
    .from("quotations")
    .select("*", { count: "exact", head: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,quote_number.ilike.%${search}%`,
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    quotations: (data ?? []) as QuotationRow[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Admin: get a single quotation by ID.
 */
export async function getQuotationById(
  id: string,
): Promise<QuotationRow | null> {
  const { data, error } = await db
    .from("quotations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as QuotationRow | null;
}

/**
 * Admin: update quotation status and optional fields.
 */
export async function updateQuotation(
  id: string,
  updates: {
    status?: QuotationStatus;
    quoted_amount?: number | null;
    admin_notes?: string | null;
    updated_by?: string | null;
  },
): Promise<QuotationRow> {
  const payload: Record<string, unknown> = {};

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.quoted_amount !== undefined) payload.quoted_amount = updates.quoted_amount;
  if (updates.admin_notes !== undefined) payload.admin_notes = updates.admin_notes;
  if (updates.updated_by !== undefined) payload.updated_by = updates.updated_by;

  const { data, error } = await db
    .from("quotations")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as QuotationRow;
}
