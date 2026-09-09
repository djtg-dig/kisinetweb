import type { MetadataRoute } from "next";

const siteUrl = "https://kisinet.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteUrl + "/pharmacies",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: siteUrl + "/tarifs",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: siteUrl + "/contact",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: siteUrl + "/terms",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: siteUrl + "/cookies",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
