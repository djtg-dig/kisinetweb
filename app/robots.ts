import type { MetadataRoute } from "next";

const siteUrl = "https://kisinet.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app/",
        "/admin/",
        "/auth/",
        "/api/",
        "/*?handoff=*",
        "/*?next=*",
      ],
    },
    sitemap: siteUrl + "/sitemap.xml",
  };
}
