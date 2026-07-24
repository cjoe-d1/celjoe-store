import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing Supabase environment variable: SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase environment variable: SUPABASE_ANON_KEY");
}

export const createSupabaseClient = (headers?: Record<string, string>) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: headers ? { headers } : undefined,
  });

export const supabase = createSupabaseClient();
