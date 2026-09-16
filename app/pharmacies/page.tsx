import type { Metadata } from "next";
import PublicPharmaciesPageClient from "./page-client";
import { defaultOpenGraph, defaultTwitter } from "@/lib/server/metadata-og";
import {
  getPublicPharmaciesPageServer,
  type PublicPharmaciesPage,
} from "@/lib/server/public-pharmacies";

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

export default async function PublicPharmaciesPage() {
  let initialData: PublicPharmaciesPage = {
    results: [],
    count: 0,
    next: null,
    previous: null,
  };
  let initialError: string | null = null;

  try {
    initialData = await getPublicPharmaciesPageServer({ page: 1 });
  } catch {
    initialError = "Le catalogue public des pharmacies est temporairement indisponible.";
  }

  return (
    <PublicPharmaciesPageClient
      initialPharmacies={initialData.results}
      initialCount={initialData.count}
      initialPage={1}
      initialError={initialError}
    />
  );
}
