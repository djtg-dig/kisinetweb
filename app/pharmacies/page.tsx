import type { Metadata } from "next";
import PublicPharmaciesPageClient from "./page-client";

const title = "Pharmacies sur Kisinet";
const description =
  "Découvrez les pharmacies publiques présentes sur Kisinet et consultez leurs informations disponibles en ligne.";
const url = "https://kisinet.com/pharmacies";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    title,
    description,
    url,
    siteName: "Kisinet",
    locale: "fr_CD",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function PublicPharmaciesPage() {
  return <PublicPharmaciesPageClient />;
}
