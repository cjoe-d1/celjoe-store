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
  /** Hosted Evolution API configuration — INACTIVE (Phase G redesign).
   *  Preserved for future server-side WhatsApp integration. */
  evolution: {
    apiUrl: getOptional("EVOLUTION_API_URL") ?? "",
    apiKey: getOptional("EVOLUTION_API_KEY") ?? "",
    instance: getOptional("EVOLUTION_INSTANCE") ?? "",
    businessNumber: getOptional("BUSINESS_WHATSAPP_NUMBER") ?? "",
  },
  /** WhatsApp — wa.me link configuration only (no server-side sending). */
  whatsapp: {
    number: getOptional("WHATSAPP_NUMBER") ?? "",
    businessNumber: getOptional("NEXT_PUBLIC_BUSINESS_WHATSAPP") ?? "",
  },
  /** Push Notifications (web-push via VAPID). */
  push: {
    enabled: getOptional("PUSH_NOTIFICATIONS_ENABLED") === "true",
    vapidPublicKey: getOptional("NEXT_PUBLIC_VAPID_PUBLIC_KEY") ?? "",
    vapidSubject: getOptional("VAPID_SUBJECT") ?? "mailto:admin@celjoe.com",
  },
  /** Cloudinary product-image storage (server-only; never prefixed NEXT_PUBLIC_). */
  cloudinary: {
    cloudName: getOptional("CLOUDINARY_CLOUD_NAME") ?? "",
    apiKey: getOptional("CLOUDINARY_API_KEY") ?? "",
    apiSecret: getOptional("CLOUDINARY_API_SECRET") ?? "",
  },
} as const;

export const requireEnv = {
  supabaseUrl: () => getRequiredAny(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]),
  supabaseAnonKey: () =>
    getRequiredAny(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"]),
  supabaseServiceRoleKey: () =>
    getRequiredAny(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"]),
  cloudinaryCloudName: () => getRequiredAny(["CLOUDINARY_CLOUD_NAME"]),
  cloudinaryApiKey: () => getRequiredAny(["CLOUDINARY_API_KEY"]),
  cloudinaryApiSecret: () => getRequiredAny(["CLOUDINARY_API_SECRET"]),
};
