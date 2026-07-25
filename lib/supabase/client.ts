import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "config/env";

const supabaseUrl = requireEnv.supabaseUrl();
const supabaseAnonKey = requireEnv.supabaseAnonKey();

export const createSupabaseClient = (headers?: Record<string, string>) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: headers ? { headers } : undefined,
  });

export const supabase = createSupabaseClient();
