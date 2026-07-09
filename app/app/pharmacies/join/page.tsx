import { MainLayout } from "@/components/layout/main-layout";
import { LinkButton } from "@/components/ui/link-button";

export default function JoinPharmacyPage() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-success-700">Invitation</p>
          <h1 className="mt-3 text-3xl font-bold text-app-text">Rejoindre une pharmacie</h1>
          <p className="mt-3 text-sm leading-6 text-app-muted">
            Cette page temporaire accueillera la demande pour rejoindre une pharmacie.
          </p>
          <LinkButton href="/app/select-pharmacy" variant="secondary" className="mt-6">
            Retour
          </LinkButton>
        </div>
      </section>
    </MainLayout>
  );
}
