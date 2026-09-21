import type { Metadata } from "next";
import PublicPharmaciesPageClient from "./page-client";
import {
  PUBLIC_PHARMACIES_CANONICAL_URL,
  PUBLIC_PHARMACIES_DESCRIPTION,
  PUBLIC_PHARMACIES_TITLE,
} from "@/lib/public-pharmacies-page-seo";
import { defaultOpenGraph, defaultTwitter } from "@/lib/server/metadata-og";
import {
  getPublicPharmaciesPageServer,
  type PublicPharmaciesPage,
} from "@/lib/server/public-pharmacies";

export const metadata: Metadata = {
  title: PUBLIC_PHARMACIES_TITLE,
  description: PUBLIC_PHARMACIES_DESCRIPTION,
  alternates: {
    canonical: PUBLIC_PHARMACIES_CANONICAL_URL,
  },
  openGraph: {
    ...defaultOpenGraph,
    title: PUBLIC_PHARMACIES_TITLE,
    description: PUBLIC_PHARMACIES_DESCRIPTION,
    url: PUBLIC_PHARMACIES_CANONICAL_URL,
  },
  twitter: {
    ...defaultTwitter,
    title: PUBLIC_PHARMACIES_TITLE,
    description: PUBLIC_PHARMACIES_DESCRIPTION,
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
