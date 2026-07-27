import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "config/env";

let cached: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = (() => {
  if (cached) return cached;
  cached = createClient(
    requireEnv.supabaseUrl(),
    requireEnv.supabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return cached;
})();

/**
 * Loose database facade that bypasses the generated Database types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = supabaseAdmin;
