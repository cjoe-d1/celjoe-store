const getOptional = (key: string): string | undefined => process.env[key];
const getRequiredAny = (keys: string[]): string => {
  for (const key of keys) {
    const value = getOptional(key);
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${keys.join(" or ")}`);
};

export const env = {
  site: {
    companyName: getOptional("COMPANY_NAME") ?? "",
    siteName: getOptional("SITE_NAME") ?? "",
  },
  supabase: {
    url:
      getOptional("NEXT_PUBLIC_SUPABASE_URL") ??
      getOptional("SUPABASE_URL") ??
      "",
    anonKey:
      getOptional("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
      getOptional("SUPABASE_ANON_KEY") ??
      "",
  },
  vercel: {
    productionUrl: getOptional("VERCEL_PROJECT_PRODUCTION_URL"),
  },
} as const;

export const requireEnv = {
  supabaseUrl: () => getRequiredAny(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]),
  supabaseAnonKey: () =>
    getRequiredAny(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"]),
  supabaseServiceRoleKey: () =>
    getRequiredAny(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"]),
};
