const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? (() => { try { return new URL(supabaseUrl).hostname; } catch { return ""; } })() : "";

const remotePatterns: Array<{ protocol: "https"; hostname: string; pathname: string }> = [
  { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
  ...(supabaseHostname
    ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/**" }]
    : []),
];

export default {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
    serverActions: {
      // 7 MB binary → ~9.33 MB base64; headroom covers the data-URL + JSON wrapper.
      bodySizeLimit: "12mb",
    },
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
    const headers = [
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
    ];

    // Immutable caching is only safe in production, where static asset names
    // are content-hashed. In dev, chunk names are stable while their contents
    // change on config/code edits, so long-lived immutable caching would pin
    // stale client bundles (e.g. next/image remotePatterns) indefinitely.
    if (process.env.NODE_ENV === "production") {
      headers.push({
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      });
    }

    return headers;
  },
};
