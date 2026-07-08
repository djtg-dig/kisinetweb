import { AppLayout } from "@/components/layout/app-layout";

type PharmacyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ pharmacyId: string }>;
};

export default async function PharmacyLayout({ children, params }: PharmacyLayoutProps) {
  const { pharmacyId } = await params;

  return <AppLayout pharmacyId={pharmacyId}>{children}</AppLayout>;
}
