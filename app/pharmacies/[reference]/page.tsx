import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicPharmacyDetail } from "@/components/pharmacies/public-pharmacy-detail";
import { getPublicPharmacyByReferenceServer } from "@/lib/server/public-pharmacies";
import { getPharmacyJsonLd } from "@/lib/server/json-ld";
import { JsonLd } from "@/components/json-ld";
import { ogImage } from "@/lib/server/metadata-og";
import {
  buildPublicPharmacyMetadataDescription,
  buildPublicPharmacyMetadataTitle,
} from "@/lib/public-pharmacy-seo";

type PublicPharmacyDetailPageProps = {
  params: Promise<{ reference: string }>;
};

const siteUrl = "https://kisinet.com";

export async function generateMetadata({
  params,
}: PublicPharmacyDetailPageProps): Promise<Metadata> {
  const { reference } = await params;
  const pharmacy = await getPublicPharmacyByReferenceServer(
    decodeURIComponent(reference),
  );

  if (!pharmacy) {
    notFound();
  }

  const title = buildPublicPharmacyMetadataTitle(pharmacy);
  const description = buildPublicPharmacyMetadataDescription(pharmacy);
  const canonicalReference = pharmacy.reference || decodeURIComponent(reference);
  const url = siteUrl + "/pharmacies/" + encodeURIComponent(canonicalReference);

  return {
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
      images: [{
        ...ogImage,
        alt: `${pharmacy.name} sur Kisinet`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function PublicPharmacyDetailPage({
  params,
}: PublicPharmacyDetailPageProps) {
  const { reference } = await params;
  const pharmacy = await getPublicPharmacyByReferenceServer(
    decodeURIComponent(reference),
  );

  if (!pharmacy) {
    notFound();
  }

  const pharmacyJsonLd = getPharmacyJsonLd(siteUrl, pharmacy);

  return (
    <PublicLayout>
      {pharmacyJsonLd && <JsonLd data={pharmacyJsonLd} />}
      <PublicPharmacyDetail pharmacy={pharmacy} />
    </PublicLayout>
  );
}
