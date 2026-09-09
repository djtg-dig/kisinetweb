import type { MetadataRoute } from "next";
import { getAllPublicPharmaciesForSitemapServer } from "@/lib/server/public-pharmacies";

const siteUrl = "https://kisinet.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
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

  try {
    const pharmacies = await getAllPublicPharmaciesForSitemapServer();
    const seenUrls = new Set(staticRoutes.map((route) => route.url));
    const pharmacyRoutes: MetadataRoute.Sitemap = [];

    pharmacies.forEach((pharmacy) => {
      const reference = pharmacy.reference?.trim();

      if (!reference || pharmacy.isPublic !== true) {
        return;
      }

      const url = siteUrl + "/pharmacies/" + encodeURIComponent(reference);

      if (seenUrls.has(url)) {
        return;
      }

      seenUrls.add(url);
      pharmacyRoutes.push({
        url,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    return [...staticRoutes, ...pharmacyRoutes];
  } catch (error) {
    console.error("Impossible de générer les pharmacies publiques du sitemap.", error);

    return staticRoutes;
  }
}
