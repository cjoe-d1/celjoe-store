import { supabase } from "lib/supabase/client";

export type QuotationStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "completed"
  | "declined";

export type QuotationRow = {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type: string | null;
  guest_count: number | null;
  event_date: string | null;
  notes: string | null;
  status: QuotationStatus;
  admin_notes: string | null;
  quoted_amount: number | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type CreateQuotationInput = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type?: string;
  guest_count?: number;
  event_date?: string;
  notes?: string;
};

/**
 * Submit a new quotation request (customer-facing, no auth required).
 */
export async function createQuotation(
  input: CreateQuotationInput,
): Promise<QuotationRow> {
  const { data, error } = await supabase
    .from("quotations")
    .insert({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      event_type: input.event_type ?? null,
      guest_count: input.guest_count ?? null,
      event_date: input.event_date ?? null,
      notes: input.notes ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as QuotationRow;
}
