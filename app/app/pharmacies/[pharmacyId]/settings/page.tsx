type PharmacySettingsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

const settingsCards = [
  {
    title: "Détails de la  Pharmacie",
    description:
      "Modifier les informations générales de la pharmacie : nom, adresse, contacts et informations administratives.",
    path: "/settings/details",
  },
  {
    title: "Ressources humaines",
    description:
      "Gérer les membres, les rôles, les permissions et les accès à la pharmacie.",
    path: "/settings/human-resources",
  },
  {
    title: "Paramètres de l’application",
    description:
      "Configurer les préférences de fonctionnement de l’espace pharmacie.",
    path: "/settings/application",
  },
];

export default async function PharmacySettingsPage({ params }: PharmacySettingsPageProps) {
  const { pharmacyId } = await params;
  const basePath = "/app/pharmacies/" + pharmacyId;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-primary-700">Paramètres</p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">Paramètres de la pharmacie</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          Gérez les informations, les membres et les préférences de cette pharmacie.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {settingsCards.map((card) => (
          <a
            key={card.path}
            href={basePath + card.path}
            className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm transition hover:border-primary-200 hover:shadow-soft"
          >
            <h2 className="text-lg font-bold text-app-text">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-app-muted">{card.description}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
