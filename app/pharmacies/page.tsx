import type { Metadata } from "next";
import PublicPharmaciesPageClient from "./page-client";
import { defaultOpenGraph, defaultTwitter } from "@/lib/server/metadata-og";

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
    ...defaultOpenGraph,
    title,
    description,
    url,
  },
  twitter: {
    ...defaultTwitter,
    title,
    description,
  },
};

export default function PublicPharmaciesPage() {
  return <PublicPharmaciesPageClient />;
}
