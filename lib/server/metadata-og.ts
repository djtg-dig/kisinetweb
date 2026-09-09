export const siteUrl = "https://kisinet.com";
export const siteDescription =
  "Kisinet est une plateforme de gestion de pharmacies conçue pour simplifier la gestion des produits, stocks, ventes, factures et activités quotidiennes des pharmacies.";

export const ogImage = {
  url: "/og/kisinet-og.png",
  width: 1200,
  height: 630,
  alt: "Kisinet - Logiciel de gestion de pharmacie",
};

export const defaultOpenGraph = {
  title: "Kisinet",
  description: siteDescription,
  url: siteUrl,
  siteName: "Kisinet",
  type: "website" as const,
  locale: "fr_CD",
  images: [ogImage],
};

export const defaultTwitter = {
  card: "summary_large_image" as const,
  title: "Kisinet",
  description: siteDescription,
  images: ["/og/kisinet-og.png"],
};
