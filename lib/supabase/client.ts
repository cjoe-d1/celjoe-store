import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "config/env";

let _supabase: SupabaseClient | undefined;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(requireEnv.supabaseUrl(), requireEnv.supabaseAnonKey());
  }
  return _supabase;
}

export const createSupabaseClient = (headers?: Record<string, string>) =>
  createClient(requireEnv.supabaseUrl(), requireEnv.supabaseAnonKey(), {
    global: headers ? { headers } : undefined,
  });

/**
 * Lazily-initialised Supabase client. Safe to import at module level in any
 * context — the env-var check and client construction only happen on first use.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver);
  },
});
