type ApplicationSettingsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

export default async function ApplicationSettingsPage({
  params,
}: ApplicationSettingsPageProps) {
  const { pharmacyId } = await params;

  return (
    <SettingsPlaceholder
      pharmacyId={pharmacyId}
      title="Paramètres de l’application"
      description="Configurer les préférences de fonctionnement de l’espace pharmacie."
    />
  );
}

function SettingsPlaceholder({
  pharmacyId,
  title,
  description,
}: {
  pharmacyId: string;
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={"/app/pharmacies/" + pharmacyId + "/settings"}
        className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
      >
        Retour aux paramètres
      </a>
      <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Paramètres</p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">{description}</p>
      </section>
    </main>
  );
}
