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
  {
    title: "Informations sur l’IA",
    description:
      "Consulter les crédits d’analyse IA de la pharmacie, la période en cours et la consommation.",
    path: "/settings/ai",
  },
];

export default async function PharmacySettingsPage({ params }: PharmacySettingsPageProps) {
  const { pharmacyId } = await params;
  const basePath = "/app/pharmacies/" + pharmacyId;
  // L'espace personnel utilise le profil connecté ; le paramètre `user` reste
  // accepté en repli mais n'est plus requis (la page résout l'utilisateur
  // courant via /api/accounts/me/).
  const mySpacePath = "/settings/me";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-primary-700">Paramètres</p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">Paramètres de la pharmacie</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          Gérez les informations, les membres et les préférences de cette pharmacie.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {settingsCards.map((card) => (
          // Carte paramètre : lien cliquable mis en évidence (survol, focus, indice « Accéder »)
          <a
            key={card.path}
            href={basePath + card.path}
            className="group flex cursor-pointer flex-col rounded-lg border border-app-border bg-app-card p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <h2 className="text-lg font-bold text-app-text">{card.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-app-muted">
              {card.description}
            </p>
            {/* Indice d'action visible au survol/focus pour renforcer l'affordance cliquable */}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
              Accéder
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </a>
        ))}

        {/* Carte « Mon espace » : lien cliquable distinct mis en évidence de la même manière */}
        <a
          href={basePath + mySpacePath}
          className="group flex cursor-pointer flex-col rounded-lg border border-primary-200 bg-primary-50 p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-primary-400 hover:bg-primary-100/50 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <h2 className="text-lg font-bold text-app-text">Mon espace dans cette pharmacie</h2>
          <p className="mt-3 flex-1 text-sm leading-6 text-app-muted">
            Consulter votre profil, votre rôle et vos permissions dans cette pharmacie.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
            Accéder
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </a>
      </section>
    </main>
  );
}
