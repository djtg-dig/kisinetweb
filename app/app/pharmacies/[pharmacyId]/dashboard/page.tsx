import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";

type DashboardPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

export default async function PharmacyDashboardPage({ params }: DashboardPageProps) {
  const { pharmacyId } = await params;

  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary-700">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold text-app-text">Pharmacie {pharmacyId}</h1>
          <p className="mt-3 text-sm leading-6 text-app-muted">
            Route temporaire du tableau de bord pharmacie.
          </p>
          <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-6">
            Changer de pharmacie
          </LinkButton>
        </div>
      </section>
    </MainLayout>
  );
}
