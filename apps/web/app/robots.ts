import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/student/", "/api/", "/login", "/register"],
      },
    ],
    sitemap: origin ? `${origin}/sitemap.xml` : "/sitemap.xml",
  };
}
