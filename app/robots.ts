import { baseUrl } from "lib/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/account/",
          "/checkout/",
          "/cart",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/kitchen", "/bbq", "/catering", "/our-story", "/search", "/product/"],
        disallow: ["/api/", "/admin/", "/account/", "/checkout/", "/cart"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
