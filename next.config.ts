export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
        ? [
            {
              protocol: "https",
              hostname: new URL(
                process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
              ).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};
