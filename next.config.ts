const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? (() => { try { return new URL(supabaseUrl).hostname; } catch { return ""; } })() : "";

const remotePatterns: Array<{ protocol: "https"; hostname: string; pathname: string }> = supabaseHostname
  ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/**" }]
  : [];

export default {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
    optimizePackageImports: [
      "@headlessui/react",
      "@supabase/ssr",
      "@supabase/supabase-js",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 hours
    remotePatterns,
  },
  /** Enable compression for better LCP. */
  compress: true,
  /** Security headers applied to ALL responses. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "0",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
