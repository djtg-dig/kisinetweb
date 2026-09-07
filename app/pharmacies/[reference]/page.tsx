import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicPharmacyDetail } from "@/components/pharmacies/public-pharmacy-detail";
import { getPublicPharmacyByReferenceServer } from "@/lib/server/public-pharmacies";

type PublicPharmacyDetailPageProps = {
  params: Promise<{ reference: string }>;
};

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

  return (
    <PublicLayout>
      <PublicPharmacyDetail pharmacy={pharmacy} />
    </PublicLayout>
  );
}
