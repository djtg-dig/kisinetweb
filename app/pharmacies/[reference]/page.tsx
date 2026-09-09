import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicPharmacyDetail } from "@/components/pharmacies/public-pharmacy-detail";
import { getPublicPharmacyByReferenceServer } from "@/lib/server/public-pharmacies";
import { getPharmacyJsonLd } from "@/lib/server/json-ld";
import { JsonLd } from "@/components/json-ld";
import { ogImage } from "@/lib/server/metadata-og";
import type { PharmacySummary } from "@/lib/api";

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

  const description = buildPharmacyDescription(pharmacy);
  const canonicalReference = pharmacy.reference || decodeURIComponent(reference);
  const url = siteUrl + "/pharmacies/" + encodeURIComponent(canonicalReference);

  return {
    title: pharmacy.name,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pharmacy.name,
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
      title: pharmacy.name,
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

function buildPharmacyDescription(pharmacy: PharmacySummary) {
  const publicDescription = cleanDescription(pharmacy.description);

  if (publicDescription) {
    return publicDescription;
  }

  const location = [pharmacy.cityOrProvince, pharmacy.country]
    .filter(Boolean)
    .join(", ");

  if (location) {
    return (
      "Découvrez " +
      pharmacy.name +
      " à " +
      location +
      " sur Kisinet et consultez ses informations publiques."
    );
  }

  return "Consultez les informations publiques de " + pharmacy.name + " sur Kisinet.";
}

function cleanDescription(value?: string) {
  const description = value?.replace(/\s+/g, " ").trim();

  if (!description) {
    return "";
  }

  return description.length > 155 ? description.slice(0, 152).trimEnd() + "..." : description;
}
